import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as path from 'path';

// 1. Définition du chemin vers le fichier .proto
const PROTO_PATH = path.resolve(__dirname, './proto/localisation.proto');

// 2. Chargement synchrone du fichier .proto
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

// 3. Extraction du package "localisation" défini dans le .proto
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
const localisationProto = protoDescriptor.localisation;

// 4. Création du serveur gRPC
const server = new grpc.Server();

// 5. Implémentation du service LocalisationService
server.addService(localisationProto.LocalisationService.service, {
  
  // Implémentation de la méthode StreamPositions
  StreamPositions: (call: any) => {
    console.log("📡 Nouvelle connexion de streaming GPS établie !");
    
    // À chaque fois qu'une nouvelle position est reçue
    call.on('data', (position: any) => {
      console.log(`📍 Position reçue - Véhicule: ${position.vehicule_id} | Lat: ${position.latitude}, Lng: ${position.longitude} | Vitesse: ${position.vitesse} km/h`);
      
      // Ici, tu pourras ajouter plus tard le code pour sauvegarder dans TimescaleDB
      // et publier une alerte de géofencing sur Kafka
      
      // Optionnel : Envoyer un accusé de réception pour cette position
      call.write({ success: true, message: 'Position bien reçue' });
    });

    // Quand le client ferme la connexion
    call.on('end', () => {
      console.log("🛑 Connexion de streaming GPS terminée.");
      call.end();
    });
    
    // Gestion des erreurs
    call.on('error', (err: any) => {
      console.error("❌ Erreur dans le stream GPS :", err);
    });
  }
});

// 6. Démarrage du serveur sur le port 50051 (port standard gRPC)
const port = '0.0.0.0:50051';
server.bindAsync(port, grpc.ServerCredentials.createInsecure(), (error, portNumber) => {
  if (error) {
    console.error("Échec du démarrage du serveur gRPC :", error);
    return;
  }
  console.log(`🚀 Service Localisation (gRPC) démarré avec succès sur le port ${portNumber}`);
});