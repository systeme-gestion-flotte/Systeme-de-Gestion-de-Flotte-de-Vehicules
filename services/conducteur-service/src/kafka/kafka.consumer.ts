import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assignation, StatutAssignation } from '../assignations/entities/assignation.entity';
import { getTracer } from '../telemetry/tracing';
import { SpanStatusCode } from '@opentelemetry/api';

export interface VehiculeAssigneEvent {
  eventType: 'VehiculeAssigneAvecSucces' | 'EchecAssignationVehicule';
  assignationId: string;
  vehiculeId: string;
  conducteurId?: string;
  raison?: string;
  timestamp: string;
}

@Injectable()
export class KafkaConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumer.name);
  private kafka: Kafka;
  private consumer: Consumer;
  private running = false;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Assignation)
    private readonly assignationRepository: Repository<Assignation>,
  ) {}

  async onModuleInit() {
    const broker = this.configService.get<string>('kafka.broker');
    const groupId = this.configService.get<string>('kafka.groupId');

    this.kafka = new Kafka({
      clientId: 'conducteur-service-consumer',
      brokers: [broker],
      retry: {
        initialRetryTime: 300,
        retries: 5,
      },
    });

    this.consumer = this.kafka.consumer({ groupId });
    await this.startConsuming();
  }

  async onModuleDestroy() {
    this.running = false;
    if (this.consumer) {
      await this.consumer.disconnect();
      this.logger.log('Kafka Consumer déconnecté');
    }
  }

  private async startConsuming() {
    const topic = this.configService.get<string>('kafka.topics.vehiculesEvents');
    try {
      await this.consumer.connect();
      await this.consumer.subscribe({ topic, fromBeginning: false });
      this.running = true;

      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
      });

      this.logger.log(`Kafka Consumer abonné au topic: ${topic}`);
    } catch (err) {
      this.logger.warn(`Impossible de démarrer le consumer Kafka: ${err.message}`);
    }
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { message } = payload;
    const tracer = getTracer();
    const span = tracer.startSpan('kafka.consume.vehiculesEvents');

    try {
      if (!message.value) return;

      const event: VehiculeAssigneEvent = JSON.parse(message.value.toString());
      this.logger.log(`Événement reçu: ${event.eventType} pour assignation ${event.assignationId}`);

      if (event.eventType === 'VehiculeAssigneAvecSucces') {
        await this.handleVehiculeAssigne(event);
      } else if (event.eventType === 'EchecAssignationVehicule') {
        await this.handleEchecAssignation(event);
      }

      span.setStatus({ code: SpanStatusCode.OK });
    } catch (err) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
      this.logger.error(`Erreur traitement message Kafka: ${err.message}`, err.stack);
    } finally {
      span.end();
    }
  }

  private async handleVehiculeAssigne(event: VehiculeAssigneEvent): Promise<void> {
    const assignation = await this.assignationRepository.findOne({
      where: { idAssignation: event.assignationId },
    });

    if (!assignation) {
      this.logger.warn(`Assignation non trouvée: ${event.assignationId}`);
      return;
    }

    assignation.statut = StatutAssignation.EN_COURS;
    await this.assignationRepository.save(assignation);
    this.logger.log(`Assignation ${event.assignationId} confirmée (véhicule assigné avec succès)`);
  }

  private async handleEchecAssignation(event: VehiculeAssigneEvent): Promise<void> {
    const assignation = await this.assignationRepository.findOne({
      where: { idAssignation: event.assignationId },
    });

    if (!assignation) {
      this.logger.warn(`Assignation non trouvée: ${event.assignationId}`);
      return;
    }

    assignation.statut = StatutAssignation.ANNULEE;
    await this.assignationRepository.save(assignation);
    this.logger.log(
      `Assignation ${event.assignationId} annulée. Raison: ${event.raison || 'inconnue'}`,
    );
  }
}
