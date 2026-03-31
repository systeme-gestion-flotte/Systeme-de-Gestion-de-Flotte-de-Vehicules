import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KafkaConsumer, VehiculeAssigneEvent } from './kafka.consumer';
import { Assignation, StatutAssignation } from '../assignations/entities/assignation.entity';

jest.mock('../telemetry/tracing', () => ({
  getTracer: jest.fn().mockReturnValue({
    startSpan: jest.fn().mockReturnValue({
      setStatus: jest.fn(),
      setAttribute: jest.fn(),
      end: jest.fn(),
    }),
  }),
}));

let capturedEachMessage: ((payload: any) => Promise<void>) | null = null;

const mockConsumer = {
  connect: jest.fn().mockResolvedValue(undefined),
  subscribe: jest.fn().mockResolvedValue(undefined),
  run: jest.fn().mockImplementation(({ eachMessage }) => {
    capturedEachMessage = eachMessage;
    return Promise.resolve();
  }),
  disconnect: jest.fn().mockResolvedValue(undefined),
};

const mockKafkaInstance = {
  consumer: jest.fn().mockReturnValue(mockConsumer),
};

jest.mock('kafkajs', () => ({
  Kafka: jest.fn().mockImplementation(() => mockKafkaInstance),
}));

describe('KafkaConsumer', () => {
  let service: KafkaConsumer;
  let assignationRepository: jest.Mocked<Repository<Assignation>>;

  beforeEach(async () => {
    jest.clearAllMocks();
    capturedEachMessage = null;
    mockConsumer.connect.mockResolvedValue(undefined);
    mockConsumer.subscribe.mockResolvedValue(undefined);
    mockConsumer.run.mockImplementation(({ eachMessage }) => {
      capturedEachMessage = eachMessage;
      return Promise.resolve();
    });
    mockConsumer.disconnect.mockResolvedValue(undefined);

    const mockRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KafkaConsumer,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              const config = {
                'kafka.broker': 'localhost:9092',
                'kafka.groupId': 'conducteur-service-group',
                'kafka.topics.vehiculesEvents': 'fleet.vehicules.events',
              };
              return config[key];
            }),
          },
        },
        {
          provide: getRepositoryToken(Assignation),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<KafkaConsumer>(KafkaConsumer);
    assignationRepository = module.get(getRepositoryToken(Assignation));
  });

  describe('onModuleInit', () => {
    it('doit créer le consumer et démarrer la consommation', async () => {
      await service.onModuleInit();
      expect(mockKafkaInstance.consumer).toHaveBeenCalledWith({ groupId: 'conducteur-service-group' });
      expect(mockConsumer.connect).toHaveBeenCalled();
      expect(mockConsumer.subscribe).toHaveBeenCalledWith({
        topic: 'fleet.vehicules.events',
        fromBeginning: false,
      });
      expect(mockConsumer.run).toHaveBeenCalled();
    });

    it('doit logger un avertissement si le démarrage échoue', async () => {
      mockConsumer.connect.mockRejectedValueOnce(new Error('Kafka indisponible'));
      await expect(service.onModuleInit()).resolves.not.toThrow();
    });
  });

  describe('onModuleDestroy', () => {
    it('doit déconnecter le consumer', async () => {
      await service.onModuleInit();
      await service.onModuleDestroy();
      expect(mockConsumer.disconnect).toHaveBeenCalled();
    });
  });

  describe('handleMessage - VehiculeAssigneAvecSucces', () => {
    const assignation: Assignation = {
      idAssignation: 'assign-1',
      vehiculeId: 'vehicule-1',
      conducteurId: 'conducteur-1',
      dateDepart: new Date(),
      dateRetour: null,
      statut: StatutAssignation.PLANIFIEE,
      createdAt: new Date(),
      conducteur: null,
    };

    it('doit mettre le statut à EN_COURS pour VehiculeAssigneAvecSucces', async () => {
      await service.onModuleInit();
      assignationRepository.findOne.mockResolvedValue({ ...assignation });
      assignationRepository.save.mockResolvedValue({ ...assignation, statut: StatutAssignation.EN_COURS });

      const event: VehiculeAssigneEvent = {
        eventType: 'VehiculeAssigneAvecSucces',
        assignationId: 'assign-1',
        vehiculeId: 'vehicule-1',
        conducteurId: 'conducteur-1',
        timestamp: new Date().toISOString(),
      };

      await capturedEachMessage!({
        message: { value: Buffer.from(JSON.stringify(event)) },
      });

      expect(assignationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ statut: StatutAssignation.EN_COURS }),
      );
    });

    it('doit logger un avertissement si assignation non trouvée (VehiculeAssigneAvecSucces)', async () => {
      await service.onModuleInit();
      assignationRepository.findOne.mockResolvedValue(null);

      const event: VehiculeAssigneEvent = {
        eventType: 'VehiculeAssigneAvecSucces',
        assignationId: 'unknown-assign',
        vehiculeId: 'vehicule-1',
        timestamp: new Date().toISOString(),
      };

      await capturedEachMessage!({
        message: { value: Buffer.from(JSON.stringify(event)) },
      });

      expect(assignationRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('handleMessage - EchecAssignationVehicule', () => {
    const assignation: Assignation = {
      idAssignation: 'assign-2',
      vehiculeId: 'vehicule-2',
      conducteurId: 'conducteur-2',
      dateDepart: new Date(),
      dateRetour: null,
      statut: StatutAssignation.PLANIFIEE,
      createdAt: new Date(),
      conducteur: null,
    };

    it('doit mettre le statut à ANNULEE pour EchecAssignationVehicule', async () => {
      await service.onModuleInit();
      assignationRepository.findOne.mockResolvedValue({ ...assignation });
      assignationRepository.save.mockResolvedValue({ ...assignation, statut: StatutAssignation.ANNULEE });

      const event: VehiculeAssigneEvent = {
        eventType: 'EchecAssignationVehicule',
        assignationId: 'assign-2',
        vehiculeId: 'vehicule-2',
        raison: 'Vehicule indisponible',
        timestamp: new Date().toISOString(),
      };

      await capturedEachMessage!({
        message: { value: Buffer.from(JSON.stringify(event)) },
      });

      expect(assignationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ statut: StatutAssignation.ANNULEE }),
      );
    });

    it('doit logger un avertissement si assignation non trouvée (EchecAssignationVehicule)', async () => {
      await service.onModuleInit();
      assignationRepository.findOne.mockResolvedValue(null);

      const event: VehiculeAssigneEvent = {
        eventType: 'EchecAssignationVehicule',
        assignationId: 'unknown-assign',
        vehiculeId: 'vehicule-2',
        timestamp: new Date().toISOString(),
      };

      await capturedEachMessage!({
        message: { value: Buffer.from(JSON.stringify(event)) },
      });

      expect(assignationRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('handleMessage - cas limites', () => {
    it('doit ignorer les messages sans valeur', async () => {
      await service.onModuleInit();

      await capturedEachMessage!({ message: { value: null } });

      expect(assignationRepository.findOne).not.toHaveBeenCalled();
    });

    it('doit gérer les erreurs JSON sans propager l\'exception', async () => {
      await service.onModuleInit();

      await expect(
        capturedEachMessage!({ message: { value: Buffer.from('json-invalide') } }),
      ).resolves.not.toThrow();
    });
  });
});
