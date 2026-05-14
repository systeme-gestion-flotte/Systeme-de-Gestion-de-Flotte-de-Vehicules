import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as path from 'path';

import { initTelemetry, getTracer, shutdownTelemetry } from './telemetry/tracing';
import { initDatabase, savePosition, getHistorique } from './database/timescale';
import { initKafkaProducer, disconnectKafkaProducer } from './kafka/producer';
import { checkGeofencing, getZonesForPosition, publierAlertGeofence } from './geofencing/zones';
import { startHttpServer } from './http/server';
import { startSimulator } from './simulator/gps-simulator';
import { Server } from 'socket.io';
import { rafraichirCache, getVehiculeInfo } from './cache/vehicule-cache';

let io: Server;

// Suivi d'état pour éviter le spam d'alertes geofencing
// Clé: vehicule_id, Valeur: nom de la dernière zone d'infraction (ou null si OK)
const lastGeofenceInfraction = new Map<string, string | null>();

// Initialisation OpenTelemetry en premier (avant tout import instrumenté)
initTelemetry();

// ── Chargement du fichier .proto ──────────────────────────────────────────────
const PROTO_PATH = path.resolve(__dirname, './proto/localisation.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
const localisationProto = protoDescriptor.localisation;

// ── Serveur gRPC ──────────────────────────────────────────────────────────────
const server = new grpc.Server();

server.addService(localisationProto.LocalisationService.service, {

  // Flux bidirectionnel : réception continue de positions GPS
  StreamPositions: (call: any) => {
    const tracer = getTracer();
    console.log('Nouvelle connexion de streaming GPS établie');

    call.on('data', async (position: any) => {
      const span = tracer.startSpan('grpc.StreamPositions.onData');
      try {
        // 1. Persistance TimescaleDB
        await savePosition({
          vehicule_id: position.vehicule_id,
          latitude: position.latitude,
          longitude: position.longitude,
          vitesse: position.vitesse,
          horodatage: position.horodatage,
        });

        // 2. Vérification géofencing avec anti-spam
        const zones = getZonesForPosition(position.latitude, position.longitude);
        const inAutorisee = zones.some(z => z.type === 'AUTORISEE');
        const inInterdite = zones.find(z => z.type === 'INTERDITE');
        
        const vehiculeId = position.vehicule_id;
        const currentInfraction = inInterdite ? inInterdite.name : (!inAutorisee ? 'Zone Autorisée' : null);
        const lastInfraction = lastGeofenceInfraction.get(vehiculeId);

        if (currentInfraction && currentInfraction !== lastInfraction) {
          // Nouvelle infraction ou changement de zone d'infraction
          const info = getVehiculeInfo(1); // TODO: mapper le bon ID
          const type = inInterdite ? 'entree_zone_interdite' : 'sortie_zone_autorisee';
          
          await publierAlertGeofence(1, info.immatriculation, info.conducteur_id || "inconnu", currentInfraction, type);
          
          lastGeofenceInfraction.set(vehiculeId, currentInfraction);
          call.write({ success: true, message: `ALERTE GEOFENCING: ${currentInfraction}` });
        } else if (!currentInfraction && lastInfraction) {
          // Retour à la normale
          lastGeofenceInfraction.set(vehiculeId, null);
          call.write({ success: true, message: 'Retour en zone autorisée' });
        } else {
          call.write({ success: true, message: 'Position enregistrée' });
        }

        // 3. Broadcast temps réel via WebSocket
        if (io) {
          io.emit('position_update', {
            vehicule_id: position.vehicule_id,
            latitude: position.latitude,
            longitude: position.longitude,
            vitesse: position.vitesse,
            horodatage: position.horodatage,
          });
        }

        span.setStatus({ code: 1 /* OK */ });
      } catch (err: any) {
        console.error('Erreur traitement position:', err.message);
        span.setStatus({ code: 2 /* ERROR */, message: err.message });
        call.write({ success: false, message: 'Erreur interne du serveur' });
      } finally {
        span.end();
      }
    });

    call.on('end', () => {
      console.log('Connexion de streaming GPS terminée');
      call.end();
    });

    call.on('error', (err: any) => {
      console.error('Erreur dans le stream GPS:', err);
    });
  },

  // Requête unaire : historique des positions d'un véhicule
  GetHistorique: async (call: any, callback: any) => {
    const { vehicule_id, depuis, jusqu_a } = call.request;
    const tracer = getTracer();
    const span = tracer.startSpan('grpc.GetHistorique');

    try {
      const rows = await getHistorique(vehicule_id, depuis, jusqu_a);
      const positions = rows.map((r) => ({
        vehicule_id: r.vehicule_id,
        latitude: r.latitude,
        longitude: r.longitude,
        vitesse: r.vitesse,
        horodatage: r.horodatage,
      }));
      span.setStatus({ code: 1 });
      callback(null, { positions });
    } catch (err: any) {
      span.setStatus({ code: 2, message: err.message });
      callback({ code: grpc.status.INTERNAL, message: err.message });
    } finally {
      span.end();
    }
  },
});

// ── Démarrage ─────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  try {
    // Base de données TimescaleDB
    await initDatabase();

    // Kafka producer (non bloquant si Kafka indisponible)
    await initKafkaProducer();

    // Cache véhicules et rafraîchissement
    await rafraichirCache();
    setInterval(rafraichirCache, 5 * 60 * 1000);

    // Serveur gRPC (port 50051)
    const grpcPort = `0.0.0.0:${process.env.GRPC_PORT || 50051}`;
    server.bindAsync(grpcPort, grpc.ServerCredentials.createInsecure(), (error, portNumber) => {
      if (error) {
        console.error('Échec du démarrage gRPC:', error);
        process.exit(1);
      }
      console.log(`Service Localisation (gRPC) démarré sur le port ${portNumber}`);
    });

    // Serveur HTTP REST + WebSocket
    const httpPort = Number(process.env.HTTP_PORT || 3002);
    const httpServer = startHttpServer(httpPort);
    
    io = new Server(httpServer, {
      cors: {
        origin: '*', // À restreindre en prod
      }
    });

    io.on('connection', (socket) => {
      console.log(`Client WebSocket connecté: ${socket.id}`);
    });

    // Simulateur GPS
    if (process.env.ENABLE_SIMULATOR === 'true') {
      startSimulator(async (position) => {
        await savePosition(position);
        
        // Broadcast simulator positions
        if (io) {
          io.emit('position_update', position);
        }

        const zones = getZonesForPosition(position.latitude, position.longitude);
        const inAutorisee = zones.some(z => z.type === 'AUTORISEE');
        const inInterdite = zones.find(z => z.type === 'INTERDITE');
        
        const vehiculeId = position.vehicule_id;
        const currentInfraction = inInterdite ? inInterdite.name : (!inAutorisee ? 'Zone Autorisée' : null);
        const lastInfraction = lastGeofenceInfraction.get(vehiculeId);

        if (currentInfraction && currentInfraction !== lastInfraction) {
          const VEHICULE_IDS = ['550e8400-e29b-41d4-a716-446655440000', 'VEH-001', 'VEH-002', 'VEH-003', 'VEH-004', 'VEH-005'];
          const numericId = VEHICULE_IDS.indexOf(vehiculeId) + 1;
          const info = getVehiculeInfo(numericId > 0 ? numericId : 1);
          const type = inInterdite ? 'entree_zone_interdite' : 'sortie_zone_autorisee';
          
          await publierAlertGeofence(numericId, info.immatriculation, info.conducteur_id || "inconnu", currentInfraction, type);
          lastGeofenceInfraction.set(vehiculeId, currentInfraction);
        } else if (!currentInfraction && lastInfraction) {
          lastGeofenceInfraction.set(vehiculeId, null);
        }
      });
    }
  } catch (err: any) {
    console.error('Erreur critique au démarrage:', err.message ?? err);
    process.exit(1);
  }
}

// ── Arrêt propre ──────────────────────────────────────────────────────────────
process.on('SIGTERM', async () => {
  console.log('SIGTERM reçu — arrêt propre...');
  server.tryShutdown(async () => {
    await disconnectKafkaProducer();
    await shutdownTelemetry();
    process.exit(0);
  });
});

main();
