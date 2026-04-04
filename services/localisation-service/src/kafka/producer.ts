import { Kafka, Producer, CompressionTypes } from 'kafkajs';

const TOPIC = process.env.KAFKA_TOPIC_GEOFENCING || 'fleet.geofencing.alerts';

export interface GeofencingAlertEvent {
  eventType: 'GeofencingAlert';
  vehiculeId: string;
  latitude: number;
  longitude: number;
  zoneId: string;
  zoneName: string;
  type: 'ENTREE' | 'SORTIE';
  timestamp: string;
}

let producer: Producer;
let connected = false;

export async function initKafkaProducer(): Promise<void> {
  const kafka = new Kafka({
    clientId: 'localisation-service',
    brokers: [(process.env.KAFKA_BROKER || 'localhost:9092')],
    retry: {
      initialRetryTime: 300,
      retries: 5,
    },
  });

  producer = kafka.producer();

  try {
    await producer.connect();
    connected = true;
    console.log('Kafka Producer connecté');
  } catch (err: any) {
    console.warn(`Impossible de se connecter à Kafka: ${err.message} — les alertes géofencing seront désactivées`);
  }
}

export async function publishGeofencingAlert(alert: Omit<GeofencingAlertEvent, 'eventType'>): Promise<void> {
  if (!connected) {
    console.warn('Kafka non connecté — alerte géofencing ignorée');
    return;
  }

  const event: GeofencingAlertEvent = { eventType: 'GeofencingAlert', ...alert };

  await producer.send({
    topic: TOPIC,
    compression: CompressionTypes.GZIP,
    messages: [
      {
        key: alert.vehiculeId,
        value: JSON.stringify(event),
        headers: {
          eventType: 'GeofencingAlert',
          source: 'localisation-service',
          timestamp: alert.timestamp,
        },
      },
    ],
  });

  console.log(`Alerte géofencing publiée: véhicule ${alert.vehiculeId} — ${alert.type} zone "${alert.zoneName}"`);
}

export async function disconnectKafkaProducer(): Promise<void> {
  if (connected) {
    await producer.disconnect();
    connected = false;
    console.log('Kafka Producer déconnecté');
  }
}
