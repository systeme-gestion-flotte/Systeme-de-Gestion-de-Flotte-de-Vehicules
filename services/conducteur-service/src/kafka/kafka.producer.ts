import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, CompressionTypes } from 'kafkajs';
import { getTracer } from '../telemetry/tracing';
import { SpanStatusCode } from '@opentelemetry/api';

export interface AssignationDemandeeEvent {
  eventType: 'AssignationDemandee';
  assignationId: string;
  vehiculeId: string;
  conducteurId: string;
  dateDepart: string;
  dateRetour?: string;
  timestamp: string;
}

@Injectable()
export class KafkaProducer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducer.name);
  private kafka: Kafka;
  private producer: Producer;
  private connected = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const broker = this.configService.get<string>('kafka.broker');
    this.kafka = new Kafka({
      clientId: 'conducteur-service-producer',
      brokers: [broker],
      retry: {
        initialRetryTime: 300,
        retries: 5,
      },
    });
    this.producer = this.kafka.producer();
    await this.connect();
  }

  async onModuleDestroy() {
    if (this.connected) {
      await this.producer.disconnect();
      this.logger.log('Kafka Producer déconnecté');
    }
  }

  private async connect() {
    try {
      await this.producer.connect();
      this.connected = true;
      this.logger.log('Kafka Producer connecté');
    } catch (err) {
      this.logger.warn(`Impossible de se connecter à Kafka: ${err.message}`);
    }
  }

  async publishAssignationDemandee(event: AssignationDemandeeEvent): Promise<void> {
    const topic = this.configService.get<string>('kafka.topics.assignationDemandee');
    const tracer = getTracer();
    const span = tracer.startSpan('kafka.publish.AssignationDemandee');

    try {
      if (!this.connected) {
        await this.connect();
      }

      await this.producer.send({
        topic,
        compression: CompressionTypes.GZIP,
        messages: [
          {
            key: event.assignationId,
            value: JSON.stringify(event),
            headers: {
              eventType: event.eventType,
              source: 'conducteur-service',
              timestamp: event.timestamp,
            },
          },
        ],
      });

      span.setStatus({ code: SpanStatusCode.OK });
      this.logger.log(`Événement AssignationDemandee publié: ${event.assignationId}`);
    } catch (err) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
      this.logger.error(`Erreur publication Kafka: ${err.message}`, err.stack);
      throw err;
    } finally {
      span.end();
    }
  }
}
