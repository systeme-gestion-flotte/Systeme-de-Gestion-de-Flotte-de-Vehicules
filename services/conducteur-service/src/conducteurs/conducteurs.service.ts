import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conducteur } from './entities/conducteur.entity';
import { CreateConducteurDto } from './dto/create-conducteur.dto';
import { UpdateConducteurDto } from './dto/update-conducteur.dto';
import { getTracer } from '../telemetry/tracing';
import { SpanStatusCode } from '@opentelemetry/api';

export interface PermisValidationResult {
  valide: boolean;
  conducteurId: string;
  numeroPermis: string;
  dateValidite: Date;
  joursRestants: number;
  message: string;
}

@Injectable()
export class ConducteursService {
  private readonly logger = new Logger(ConducteursService.name);

  constructor(
    @InjectRepository(Conducteur)
    private readonly conducteurRepository: Repository<Conducteur>,
  ) {}

  async findAll(): Promise<Conducteur[]> {
    const tracer = getTracer();
    const span = tracer.startSpan('conducteurs.findAll');
    try {
      const conducteurs = await this.conducteurRepository.find({
        where: { actif: true },
        order: { nom: 'ASC', prenom: 'ASC' },
      });
      span.setStatus({ code: SpanStatusCode.OK });
      return conducteurs;
    } catch (err) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
      throw err;
    } finally {
      span.end();
    }
  }

  async findOne(id: string): Promise<Conducteur> {
    const tracer = getTracer();
    const span = tracer.startSpan('conducteurs.findOne');
    span.setAttribute('conducteur.id', id);
    try {
      const conducteur = await this.conducteurRepository.findOne({
        where: { idConducteur: id },
        relations: ['assignations'],
      });
      if (!conducteur) {
        throw new NotFoundException(`Conducteur ${id} non trouvé`);
      }
      span.setStatus({ code: SpanStatusCode.OK });
      return conducteur;
    } catch (err) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
      throw err;
    } finally {
      span.end();
    }
  }

  async create(dto: CreateConducteurDto): Promise<Conducteur> {
    const tracer = getTracer();
    const span = tracer.startSpan('conducteurs.create');
    try {
      const existing = await this.conducteurRepository.findOne({
        where: [{ email: dto.email }, { numeroPermis: dto.numeroPermis }],
      });
      if (existing) {
        throw new ConflictException('Email ou numéro de permis déjà utilisé');
      }

      const conducteur = this.conducteurRepository.create({
        ...dto,
        dateValiditePermis: new Date(dto.dateValiditePermis),
      });
      const saved = await this.conducteurRepository.save(conducteur);
      span.setStatus({ code: SpanStatusCode.OK });
      this.logger.log(`Conducteur créé: ${saved.idConducteur}`);
      return saved;
    } catch (err) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
      throw err;
    } finally {
      span.end();
    }
  }

  async update(id: string, dto: UpdateConducteurDto): Promise<Conducteur> {
    const tracer = getTracer();
    const span = tracer.startSpan('conducteurs.update');
    span.setAttribute('conducteur.id', id);
    try {
      const conducteur = await this.findOne(id);

      if (dto.email && dto.email !== conducteur.email) {
        const existing = await this.conducteurRepository.findOne({
          where: { email: dto.email },
        });
        if (existing) {
          throw new ConflictException('Email déjà utilisé par un autre conducteur');
        }
      }

      if (dto.numeroPermis && dto.numeroPermis !== conducteur.numeroPermis) {
        const existing = await this.conducteurRepository.findOne({
          where: { numeroPermis: dto.numeroPermis },
        });
        if (existing) {
          throw new ConflictException('Numéro de permis déjà utilisé par un autre conducteur');
        }
      }

      const updated = this.conducteurRepository.merge(conducteur, {
        ...dto,
        dateValiditePermis: dto.dateValiditePermis
          ? new Date(dto.dateValiditePermis)
          : conducteur.dateValiditePermis,
      });
      const saved = await this.conducteurRepository.save(updated);
      span.setStatus({ code: SpanStatusCode.OK });
      this.logger.log(`Conducteur mis à jour: ${id}`);
      return saved;
    } catch (err) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
      throw err;
    } finally {
      span.end();
    }
  }

  async remove(id: string): Promise<void> {
    const tracer = getTracer();
    const span = tracer.startSpan('conducteurs.remove');
    span.setAttribute('conducteur.id', id);
    try {
      const conducteur = await this.findOne(id);
      conducteur.actif = false;
      await this.conducteurRepository.save(conducteur);
      span.setStatus({ code: SpanStatusCode.OK });
      this.logger.log(`Conducteur désactivé (soft delete): ${id}`);
    } catch (err) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
      throw err;
    } finally {
      span.end();
    }
  }

  async validerPermis(id: string): Promise<PermisValidationResult> {
    const tracer = getTracer();
    const span = tracer.startSpan('conducteurs.validerPermis');
    span.setAttribute('conducteur.id', id);
    try {
      const conducteur = await this.findOne(id);
      const now = new Date();
      const dateValidite = new Date(conducteur.dateValiditePermis);
      const diffMs = dateValidite.getTime() - now.getTime();
      const joursRestants = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const valide = diffMs > 0;

      const result: PermisValidationResult = {
        valide,
        conducteurId: id,
        numeroPermis: conducteur.numeroPermis,
        dateValidite,
        joursRestants,
        message: valide
          ? `Permis valide encore ${joursRestants} jour(s)`
          : `Permis expiré depuis ${Math.abs(joursRestants)} jour(s)`,
      };

      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (err) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
      throw err;
    } finally {
      span.end();
    }
  }

  async findAssignations(id: string) {
    const conducteur = await this.findOne(id);
    return conducteur.assignations || [];
  }
}
