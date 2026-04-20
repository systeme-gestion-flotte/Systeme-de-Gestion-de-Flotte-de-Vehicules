import { Test, TestingModule } from '@nestjs/testing';
import { AssignationsController } from './assignations.controller';
import { AssignationsService } from './assignations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { StatutAssignation } from './entities/assignation.entity';

jest.mock('../telemetry/tracing', () => ({
  getTracer: jest.fn().mockReturnValue({
    startSpan: jest.fn().mockReturnValue({
      setStatus: jest.fn(),
      setAttribute: jest.fn(),
      end: jest.fn(),
    }),
  }),
}));

const mockAssignation = {
  idAssignation: 'assign-uuid-001',
  vehiculeId: 'vehicule-uuid-001',
  conducteurId: 'conducteur-uuid-001',
  dateDepart: new Date('2026-04-01T08:00:00Z'),
  dateRetour: null,
  statut: StatutAssignation.PLANIFIEE,
  createdAt: new Date(),
};

describe('AssignationsController', () => {
  let controller: AssignationsController;
  let service: jest.Mocked<AssignationsService>;

  beforeEach(async () => {
    const mockService = {
      findAll: jest.fn().mockResolvedValue([mockAssignation]),
      findOne: jest.fn().mockResolvedValue(mockAssignation),
      create: jest.fn().mockResolvedValue(mockAssignation),
      terminer: jest.fn().mockResolvedValue({ ...mockAssignation, statut: StatutAssignation.TERMINEE }),
      annuler: jest.fn().mockResolvedValue({ ...mockAssignation, statut: StatutAssignation.ANNULEE }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssignationsController],
      providers: [{ provide: AssignationsService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AssignationsController>(AssignationsController);
    service = module.get(AssignationsService);
  });

  it('doit être défini', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('doit retourner toutes les assignations', async () => {
      const result = await controller.findAll();
      expect(result).toEqual([mockAssignation]);
    });
  });

  describe('findOne', () => {
    it('doit retourner une assignation par ID', async () => {
      const result = await controller.findOne(mockAssignation.idAssignation);
      expect(result).toEqual(mockAssignation);
    });
  });

  describe('create', () => {
    it('doit créer une assignation', async () => {
      const dto = {
        vehiculeId: 'vehicule-uuid-001',
        conducteurId: 'conducteur-uuid-001',
        dateDepart: '2026-04-01T08:00:00Z',
      };
      const result = await controller.create(dto);
      expect(result).toEqual(mockAssignation);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('terminer', () => {
    it('doit terminer une assignation', async () => {
      const result = await controller.terminer(mockAssignation.idAssignation);
      expect(result.statut).toBe(StatutAssignation.TERMINEE);
      expect(service.terminer).toHaveBeenCalledWith(mockAssignation.idAssignation);
    });
  });

  describe('annuler', () => {
    it('doit annuler une assignation', async () => {
      const result = await controller.annuler(mockAssignation.idAssignation);
      expect(result.statut).toBe(StatutAssignation.ANNULEE);
      expect(service.annuler).toHaveBeenCalledWith(mockAssignation.idAssignation);
    });
  });
});
