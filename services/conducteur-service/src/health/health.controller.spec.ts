import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';

const mockHealthResult = {
  status: 'ok',
  info: { database: { status: 'up' } },
  error: {},
  details: { database: { status: 'up' } },
};

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: jest.Mocked<HealthCheckService>;
  let typeOrmHealthIndicator: jest.Mocked<TypeOrmHealthIndicator>;

  beforeEach(async () => {
    const mockHealthCheck = jest.fn().mockImplementation(async (fns: (() => any)[]) => {
      await Promise.all(fns.map((fn) => fn()));
      return mockHealthResult;
    });

    const mockPingCheck = jest.fn().mockResolvedValue({ database: { status: 'up' } });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: { check: mockHealthCheck },
        },
        {
          provide: TypeOrmHealthIndicator,
          useValue: { pingCheck: mockPingCheck },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get(HealthCheckService);
    typeOrmHealthIndicator = module.get(TypeOrmHealthIndicator);
  });

  describe('check', () => {
    it('doit retourner le résultat du health check', async () => {
      const result = await controller.check();

      expect(result).toEqual(mockHealthResult);
      expect(healthCheckService.check).toHaveBeenCalled();
    });

    it('doit appeler pingCheck sur la base de données', async () => {
      await controller.check();

      expect(typeOrmHealthIndicator.pingCheck).toHaveBeenCalledWith('database');
    });
  });

  describe('healthDetailed', () => {
    it('doit retourner le résultat du health check détaillé', async () => {
      const result = await controller.healthDetailed();

      expect(result).toEqual(mockHealthResult);
      expect(healthCheckService.check).toHaveBeenCalled();
    });

    it('doit appeler pingCheck sur la base de données', async () => {
      await controller.healthDetailed();

      expect(typeOrmHealthIndicator.pingCheck).toHaveBeenCalledWith('database');
    });
  });
});
