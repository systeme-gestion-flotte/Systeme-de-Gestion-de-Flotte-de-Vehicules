const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const PROTO_PATH = path.resolve(__dirname, '../services/localisation-service/src/proto/localisation.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const LocalisationService = protoDescriptor.localisation.LocalisationService;

const client = new LocalisationService('localhost:50051', grpc.credentials.createInsecure());

function testUnary() {
  console.log('--- Test GetHistorique (Unaire) ---');
  client.GetHistorique({
    vehicule_id: '550e8400-e29b-41d4-a716-446655440000',
    depuis: '2024-01-01T00:00:00Z',
    jusqu_a: new Date().toISOString()
  }, (err, response) => {
    if (err) {
      console.error('Erreur Unaire:', err.message);
    } else {
      console.log('Historique reçu:', response.positions.length, 'positions');
      console.log('Dernière position:', response.positions[response.positions.length - 1]);
    }
  });
}

function testStream() {
  console.log('--- Test StreamPositions (Bidirectionnel) ---');
  const stream = client.StreamPositions();

  stream.on('data', (ack) => {
    console.log('Reçu du serveur:', ack.message);
  });

  stream.on('end', () => {
    console.log('Stream terminé par le serveur');
  });

  // Envoyer 3 positions
  const vehicule_id = '550e8400-e29b-41d4-a716-446655440000';
  
  [1, 2, 3].forEach((i) => {
    setTimeout(() => {
      console.log(`Envoi position ${i}...`);
      stream.write({
        vehicule_id,
        latitude: 49.443 + (i * 0.001),
        longitude: 1.099 + (i * 0.001),
        vitesse: 50 + (i * 5),
        horodatage: new Date().toISOString()
      });
      
      if (i === 3) {
        setTimeout(() => stream.end(), 1000);
      }
    }, i * 1000);
  });
}

// Lancer les tests
testUnary();
setTimeout(testStream, 2000);
