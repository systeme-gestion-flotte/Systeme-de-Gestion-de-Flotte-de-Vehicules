import { Test, TestingModule } from '@nestjs/testing';
import { ConducteursController } from './conducteurs.controller';
import { ConducteursService } from './conducteurs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CategoriePermis } from './entities/conducteur.entity';

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

describe('ConducteursController', () => {
  let controller: ConducteursController;
  let service: jest.Mocked<ConducteursService>;

  beforeEach(async () => {
    const mockService = {
      findAll: jest.fn().mockResolvedValue([mockConducteur]),
      findOne: jest.fn().mockResolvedValue(mockConducteur),
      create: jest.fn().mockResolvedValue(mockConducteur),
      update: jest.fn().mockResolvedValue(mockConducteur),
      remove: jest.fn().mockResolvedValue(undefined),
      validerPermis: jest.fn().mockResolvedValue({ valide: true }),
      findAssignations: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConducteursController],
      providers: [
        { provide: ConducteursService, useValue: mockService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ConducteursController>(ConducteursController);
    service = module.get(ConducteursService);
  });

  it('doit être défini', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('doit retourner la liste des conducteurs', async () => {
      const result = await controller.findAll();
      expect(result).toEqual([mockConducteur]);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('doit retourner un conducteur par ID', async () => {
      const result = await controller.findOne(mockConducteur.idConducteur);
      expect(result).toEqual(mockConducteur);
      expect(service.findOne).toHaveBeenCalledWith(mockConducteur.idConducteur);
    });
  });

  describe('create', () => {
    it('doit créer un conducteur', async () => {
      const dto = {
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean.dupont@example.com',
        numeroPermis: 'AB-123456',
        categorie: [CategoriePermis.B],
        dateValiditePermis: '2030-12-31',
      };
      const result = await controller.create(dto);
      expect(result).toEqual(mockConducteur);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('doit mettre à jour un conducteur', async () => {
      const dto = { nom: 'Martin' };
      const result = await controller.update(mockConducteur.idConducteur, dto);
      expect(result).toEqual(mockConducteur);
      expect(service.update).toHaveBeenCalledWith(mockConducteur.idConducteur, dto);
    });
  });

  describe('remove', () => {
    it('doit supprimer un conducteur', async () => {
      await controller.remove(mockConducteur.idConducteur);
      expect(service.remove).toHaveBeenCalledWith(mockConducteur.idConducteur);
    });
  });

  describe('validerPermis', () => {
    it('doit valider le permis d\'un conducteur', async () => {
      const result = await controller.validerPermis(mockConducteur.idConducteur);
      expect(result).toEqual({ valide: true });
      expect(service.validerPermis).toHaveBeenCalledWith(mockConducteur.idConducteur);
    });
  });

  describe('findAssignations', () => {
    it('doit retourner les assignations du conducteur', async () => {
      const result = await controller.findAssignations(mockConducteur.idConducteur);
      expect(result).toEqual([]);
      expect(service.findAssignations).toHaveBeenCalledWith(mockConducteur.idConducteur);
    });
  });
});
