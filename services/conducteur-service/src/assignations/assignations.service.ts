import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assignation, StatutAssignation } from './entities/assignation.entity';
import { CreateAssignationDto } from './dto/create-assignation.dto';
import { UpdateAssignationDto } from './dto/update-assignation.dto';
import { KafkaProducer } from '../kafka/kafka.producer';
import { ConducteursService } from '../conducteurs/conducteurs.service';
import { getTracer } from '../telemetry/tracing';
import { SpanStatusCode } from '@opentelemetry/api';

@Injectable()
export class AssignationsService {
  private readonly logger = new Logger(AssignationsService.name);

  constructor(
    @InjectRepository(Assignation)
    private readonly assignationRepository: Repository<Assignation>,
    private readonly kafkaProducer: KafkaProducer,
    private readonly conducteursService: ConducteursService,
  ) {}

  async findAll(): Promise<Assignation[]> {
    const tracer = getTracer();
    const span = tracer.startSpan('assignations.findAll');
    try {
      const assignations = await this.assignationRepository.find({
        relations: ['conducteur'],
        order: { createdAt: 'DESC' },
      });
      span.setStatus({ code: SpanStatusCode.OK });
      return assignations;
    } catch (err) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
      throw err;
    } finally {
      span.end();
    }
  }

  async findOne(id: string): Promise<Assignation> {
    const tracer = getTracer();
    const span = tracer.startSpan('assignations.findOne');
    span.setAttribute('assignation.id', id);
    try {
      const assignation = await this.assignationRepository.findOne({
        where: { idAssignation: id },
        relations: ['conducteur'],
      });
      if (!assignation) {
        throw new NotFoundException(`Assignation ${id} non trouvée`);
      }
      span.setStatus({ code: SpanStatusCode.OK });
      return assignation;
    } catch (err) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
      throw err;
    } finally {
      span.end();
    }
  }

  async create(dto: CreateAssignationDto): Promise<Assignation> {
    const tracer = getTracer();
    const span = tracer.startSpan('assignations.create');
    try {
      await this.conducteursService.findOne(dto.conducteurId);

      const validation = await this.conducteursService.validerPermis(dto.conducteurId);
      if (!validation.valide) {
        throw new BadRequestException(
          `Le conducteur ${dto.conducteurId} a un permis expiré`,
        );
      }

      const assignation = this.assignationRepository.create({
        vehiculeId: dto.vehiculeId,
        conducteurId: dto.conducteurId,
        dateDepart: new Date(dto.dateDepart),
        dateRetour: dto.dateRetour ? new Date(dto.dateRetour) : null,
        statut: StatutAssignation.PLANIFIEE,
      });

      const saved = await this.assignationRepository.save(assignation);

      await this.kafkaProducer.publishAssignationDemandee({
        eventType: 'AssignationDemandee',
        assignationId: saved.idAssignation,
        vehiculeId: saved.vehiculeId,
        conducteurId: saved.conducteurId,
        dateDepart: saved.dateDepart.toISOString(),
        dateRetour: saved.dateRetour?.toISOString(),
        timestamp: new Date().toISOString(),
      });

      span.setStatus({ code: SpanStatusCode.OK });
      this.logger.log(`Assignation créée et événement publié: ${saved.idAssignation}`);
      return saved;
    } catch (err) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
      throw err;
    } finally {
      span.end();
    }
  }

  async terminer(id: string): Promise<Assignation> {
    const tracer = getTracer();
    const span = tracer.startSpan('assignations.terminer');
    span.setAttribute('assignation.id', id);
    try {
      const assignation = await this.findOne(id);

      if (assignation.statut === StatutAssignation.TERMINEE) {
        throw new BadRequestException('Assignation déjà terminée');
      }
      if (assignation.statut === StatutAssignation.ANNULEE) {
        throw new BadRequestException('Impossible de terminer une assignation annulée');
      }

      assignation.statut = StatutAssignation.TERMINEE;
      if (!assignation.dateRetour) {
        assignation.dateRetour = new Date();
      }

      const saved = await this.assignationRepository.save(assignation);
      span.setStatus({ code: SpanStatusCode.OK });
      this.logger.log(`Assignation terminée: ${id}`);
      return saved;
    } catch (err) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
      throw err;
    } finally {
      span.end();
    }
  }

  async annuler(id: string): Promise<Assignation> {
    const tracer = getTracer();
    const span = tracer.startSpan('assignations.annuler');
    span.setAttribute('assignation.id', id);
    try {
      const assignation = await this.findOne(id);

      if (assignation.statut === StatutAssignation.TERMINEE) {
        throw new BadRequestException('Impossible d\'annuler une assignation terminée');
      }
      if (assignation.statut === StatutAssignation.ANNULEE) {
        throw new BadRequestException('Assignation déjà annulée');
      }

      assignation.statut = StatutAssignation.ANNULEE;
      const saved = await this.assignationRepository.save(assignation);
      span.setStatus({ code: SpanStatusCode.OK });
      this.logger.log(`Assignation annulée: ${id}`);
      return saved;
    } catch (err) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
      throw err;
    } finally {
      span.end();
    }
  }

  async update(id: string, dto: UpdateAssignationDto): Promise<Assignation> {
    const assignation = await this.findOne(id);
    const updated = this.assignationRepository.merge(assignation, {
      ...dto,
      dateDepart: dto.dateDepart ? new Date(dto.dateDepart) : assignation.dateDepart,
      dateRetour: dto.dateRetour ? new Date(dto.dateRetour) : assignation.dateRetour,
    });
    return this.assignationRepository.save(updated);
  }
}
