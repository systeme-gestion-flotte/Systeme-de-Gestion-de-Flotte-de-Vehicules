import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as path from 'path';

import { initTelemetry, getTracer, shutdownTelemetry } from './telemetry/tracing';
import { initDatabase, savePosition, getHistorique } from './database/timescale';
import { initKafkaProducer, publishGeofencingAlert, disconnectKafkaProducer } from './kafka/producer';
import { checkGeofencing } from './geofencing/zones';
import { startHttpServer } from './http/server';
import { startSimulator } from './simulator/gps-simulator';

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

        // 2. Vérification géofencing
        const geofencing = checkGeofencing(position.latitude, position.longitude);
        if (geofencing.violated && geofencing.zone) {
          await publishGeofencingAlert({
            vehiculeId: position.vehicule_id,
            latitude: position.latitude,
            longitude: position.longitude,
            zoneId: geofencing.zone.id,
            zoneName: geofencing.zone.name,
            type: 'ENTREE',
            timestamp: position.horodatage || new Date().toISOString(),
          });

          call.write({
            success: true,
            message: `ALERTE GEOFENCING: zone interdite "${geofencing.zone.name}"`,
          });
        } else {
          call.write({ success: true, message: 'Position enregistrée' });
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

    // Serveur gRPC (port 50051)
    const grpcPort = `0.0.0.0:${process.env.GRPC_PORT || 50051}`;
    server.bindAsync(grpcPort, grpc.ServerCredentials.createInsecure(), (error, portNumber) => {
      if (error) {
        console.error('Échec du démarrage gRPC:', error);
        process.exit(1);
      }
      console.log(`Service Localisation (gRPC) démarré sur le port ${portNumber}`);
    });

    // Serveur HTTP REST (historique consultable)
    const httpPort = Number(process.env.HTTP_PORT || 3002);
    startHttpServer(httpPort);

    // Simulateur GPS (optionnel — activé via variable d'environnement)
    if (process.env.ENABLE_SIMULATOR === 'true') {
      startSimulator(async (position) => {
        await savePosition(position);
        const geofencing = checkGeofencing(position.latitude, position.longitude);
        if (geofencing.violated && geofencing.zone) {
          await publishGeofencingAlert({
            vehiculeId: position.vehicule_id,
            latitude: position.latitude,
            longitude: position.longitude,
            zoneId: geofencing.zone.id,
            zoneName: geofencing.zone.name,
            type: 'ENTREE',
            timestamp: position.horodatage,
          });
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
