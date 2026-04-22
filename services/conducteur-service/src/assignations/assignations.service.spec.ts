import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AssignationsService } from './assignations.service';
import { Assignation, StatutAssignation } from './entities/assignation.entity';
import { KafkaProducer } from '../kafka/kafka.producer';
import { ConducteursService } from '../conducteurs/conducteurs.service';
import { CreateAssignationDto } from './dto/create-assignation.dto';
import { CategoriePermis } from '../conducteurs/entities/conducteur.entity';

jest.mock('../telemetry/tracing', () => ({
  getTracer: jest.fn().mockReturnValue({
    startSpan: jest.fn().mockReturnValue({
      setStatus: jest.fn(),
      setAttribute: jest.fn(),
      end: jest.fn(),
    }),
  }),
}));

const mockConducteur = {
  idConducteur: '550e8400-e29b-41d4-a716-446655440001',
  nom: 'Dupont',
  prenom: 'Jean',
  email: 'jean.dupont@example.com',
  numeroPermis: 'AB-123456',
  categorie: [CategoriePermis.B],
  telephone: '0606060606',
  dateValiditePermis: new Date('2030-12-31'),
  actif: true,
  createdAt: new Date(),
  assignations: [],
};

const mockAssignation: Assignation = {
  idAssignation: 'assign-uuid-001',
  vehiculeId: 'vehicule-uuid-001',
  conducteurId: mockConducteur.idConducteur,
  dateDepart: new Date('2026-04-01T08:00:00Z'),
  dateRetour: null,
  statut: StatutAssignation.PLANIFIEE,
  createdAt: new Date(),
  conducteur: mockConducteur as any,
};

describe('AssignationsService', () => {
  let service: AssignationsService;
  let repository: jest.Mocked<Repository<Assignation>>;
  let kafkaProducer: jest.Mocked<KafkaProducer>;
  let conducteursService: jest.Mocked<ConducteursService>;

  beforeEach(async () => {
    const mockRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      merge: jest.fn(),
    };

    const mockKafkaProducer = {
      publishAssignationDemandee: jest.fn().mockResolvedValue(undefined),
    };

    const mockConducteursService = {
      findOne: jest.fn().mockResolvedValue(mockConducteur),
      validerPermis: jest.fn().mockResolvedValue({
        valide: true,
        conducteurId: mockConducteur.idConducteur,
        joursRestants: 1000,
        message: 'Permis valide',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignationsService,
        { provide: getRepositoryToken(Assignation), useValue: mockRepo },
        { provide: KafkaProducer, useValue: mockKafkaProducer },
        { provide: ConducteursService, useValue: mockConducteursService },
      ],
    }).compile();

    service = module.get<AssignationsService>(AssignationsService);
    repository = module.get(getRepositoryToken(Assignation));
    kafkaProducer = module.get(KafkaProducer);
    conducteursService = module.get(ConducteursService);
  });

  describe('findAll', () => {
    it('doit retourner toutes les assignations', async () => {
      repository.find.mockResolvedValue([mockAssignation]);
      const result = await service.findAll();
      expect(result).toEqual([mockAssignation]);
    });

    it('doit retourner un tableau vide si aucune assignation', async () => {
      repository.find.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('doit retourner une assignation par ID', async () => {
      repository.findOne.mockResolvedValue(mockAssignation);
      const result = await service.findOne(mockAssignation.idAssignation);
      expect(result).toEqual(mockAssignation);
    });

    it('doit lever NotFoundException si assignation non trouvée', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.findOne('unknown-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto: CreateAssignationDto = {
      vehiculeId: 'vehicule-uuid-001',
      conducteurId: mockConducteur.idConducteur,
      dateDepart: '2026-04-01T08:00:00Z',
    };

    it('doit créer une assignation et publier un événement Kafka', async () => {
      repository.create.mockReturnValue(mockAssignation);
      repository.save.mockResolvedValue(mockAssignation);

      const result = await service.create(createDto);

      expect(conducteursService.findOne).toHaveBeenCalledWith(createDto.conducteurId);
      expect(conducteursService.validerPermis).toHaveBeenCalledWith(createDto.conducteurId);
      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
      expect(kafkaProducer.publishAssignationDemandee).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'AssignationDemandee',
          vehiculeId: createDto.vehiculeId,
          conducteurId: createDto.conducteurId,
        }),
      );
      expect(result).toEqual(mockAssignation);
    });

    it('doit lever BadRequestException si le permis est expiré', async () => {
      conducteursService.validerPermis.mockResolvedValue({
        valide: false,
        conducteurId: createDto.conducteurId,
        joursRestants: -100,
        message: 'Permis expiré',
        numeroPermis: 'AB-123456',
        dateValidite: new Date('2020-01-01'),
      });

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
      expect(kafkaProducer.publishAssignationDemandee).not.toHaveBeenCalled();
    });

    it('doit lever NotFoundException si conducteur non trouvé', async () => {
      conducteursService.findOne.mockRejectedValue(
        new NotFoundException('Conducteur non trouvé'),
      );
      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('terminer', () => {
    it('doit terminer une assignation en cours', async () => {
      const assignationEnCours = { ...mockAssignation, statut: StatutAssignation.EN_COURS };
      repository.findOne.mockResolvedValue(assignationEnCours);
      repository.save.mockResolvedValue({
        ...assignationEnCours,
        statut: StatutAssignation.TERMINEE,
      });

      const result = await service.terminer(mockAssignation.idAssignation);
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ statut: StatutAssignation.TERMINEE }),
      );
    });

    it('doit lever BadRequestException si assignation déjà terminée', async () => {
      const assignationTerminee = { ...mockAssignation, statut: StatutAssignation.TERMINEE };
      repository.findOne.mockResolvedValue(assignationTerminee);
      await expect(service.terminer(mockAssignation.idAssignation)).rejects.toThrow(BadRequestException);
    });

    it('doit lever BadRequestException si assignation est annulée', async () => {
      const assignationAnnulee = { ...mockAssignation, statut: StatutAssignation.ANNULEE };
      repository.findOne.mockResolvedValue(assignationAnnulee);
      await expect(service.terminer(mockAssignation.idAssignation)).rejects.toThrow(BadRequestException);
    });

    it('doit lever NotFoundException si assignation non trouvée', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.terminer('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('annuler', () => {
    it('doit annuler une assignation planifiée', async () => {
      repository.findOne.mockResolvedValue({ ...mockAssignation });
      repository.save.mockResolvedValue({
        ...mockAssignation,
        statut: StatutAssignation.ANNULEE,
      });

      const result = await service.annuler(mockAssignation.idAssignation);
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ statut: StatutAssignation.ANNULEE }),
      );
    });

    it('doit lever BadRequestException si assignation est terminée', async () => {
      repository.findOne.mockResolvedValue({
        ...mockAssignation,
        statut: StatutAssignation.TERMINEE,
      });
      await expect(service.annuler(mockAssignation.idAssignation)).rejects.toThrow(BadRequestException);
    });

    it('doit lever BadRequestException si assignation déjà annulée', async () => {
      repository.findOne.mockResolvedValue({
        ...mockAssignation,
        statut: StatutAssignation.ANNULEE,
      });
      await expect(service.annuler(mockAssignation.idAssignation)).rejects.toThrow(BadRequestException);
    });
  });
});
