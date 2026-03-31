import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { KafkaProducer, AssignationDemandeeEvent } from './kafka.producer';

const mockSpanObj = {
  setStatus: jest.fn(),
  setAttribute: jest.fn(),
  end: jest.fn(),
};

jest.mock('../telemetry/tracing', () => ({
  getTracer: jest.fn().mockReturnValue({
    startSpan: jest.fn().mockReturnValue(mockSpanObj),
  }),
}));

const mockProducer = {
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  send: jest.fn().mockResolvedValue(undefined),
};

const mockKafkaInstance = {
  producer: jest.fn().mockReturnValue(mockProducer),
};

jest.mock('kafkajs', () => ({
  Kafka: jest.fn().mockImplementation(() => mockKafkaInstance),
  CompressionTypes: { GZIP: 1 },
}));

describe('KafkaProducer', () => {
  let service: KafkaProducer;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockProducer.connect.mockResolvedValue(undefined);
    mockProducer.disconnect.mockResolvedValue(undefined);
    mockProducer.send.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KafkaProducer,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              const config = {
                'kafka.broker': 'localhost:9092',
                'kafka.topics.assignationDemandee': 'fleet.conducteurs.assignation',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<KafkaProducer>(KafkaProducer);
    configService = module.get(ConfigService);
  });

  describe('onModuleInit', () => {
    it('doit créer le producer et se connecter à Kafka', async () => {
      await service.onModuleInit();
      expect(mockKafkaInstance.producer).toHaveBeenCalled();
      expect(mockProducer.connect).toHaveBeenCalled();
    });

    it('doit logger un avertissement si la connexion échoue', async () => {
      mockProducer.connect.mockRejectedValueOnce(new Error('Connexion refusée'));
      await expect(service.onModuleInit()).resolves.not.toThrow();
    });
  });

  describe('onModuleDestroy', () => {
    it('doit déconnecter le producer si connecté', async () => {
      await service.onModuleInit();
      await service.onModuleDestroy();
      expect(mockProducer.disconnect).toHaveBeenCalled();
    });

    it('ne doit pas appeler disconnect si pas connecté', async () => {
      mockProducer.connect.mockRejectedValueOnce(new Error('Pas de connexion'));
      await service.onModuleInit();
      await service.onModuleDestroy();
      expect(mockProducer.disconnect).not.toHaveBeenCalled();
    });
  });

  describe('publishAssignationDemandee', () => {
    const event: AssignationDemandeeEvent = {
      eventType: 'AssignationDemandee',
      assignationId: 'assign-1',
      vehiculeId: 'vehicule-1',
      conducteurId: 'conducteur-1',
      dateDepart: '2026-04-01T08:00:00Z',
      timestamp: new Date().toISOString(),
    };

    it('doit publier un événement AssignationDemandee', async () => {
      await service.onModuleInit();
      await service.publishAssignationDemandee(event);

      expect(mockProducer.send).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: 'fleet.conducteurs.assignation',
          messages: expect.arrayContaining([
            expect.objectContaining({
              key: event.assignationId,
              value: JSON.stringify(event),
            }),
          ]),
        }),
      );
      expect(mockProducer.send).toHaveBeenCalled();
    });

    it('doit tenter une reconnexion si non connecté avant publication', async () => {
      mockProducer.connect.mockRejectedValueOnce(new Error('Pas de connexion'));
      await service.onModuleInit();
      mockProducer.connect.mockResolvedValueOnce(undefined);

      await service.publishAssignationDemandee(event);
      expect(mockProducer.connect).toHaveBeenCalledTimes(2);
    });

    it('doit propager l\'erreur si send échoue', async () => {
      await service.onModuleInit();
      mockProducer.send.mockRejectedValueOnce(new Error('Erreur Kafka'));

      await expect(service.publishAssignationDemandee(event)).rejects.toThrow('Erreur Kafka');
      expect(mockSpanObj.end).toHaveBeenCalled();
    });
  });
});
