import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ConducteursService } from './conducteurs.service';
import { Conducteur, CategoriePermis } from './entities/conducteur.entity';
import { CreateConducteurDto } from './dto/create-conducteur.dto';
import { UpdateConducteurDto } from './dto/update-conducteur.dto';

const mockConducteur: Conducteur = {
  idConducteur: '550e8400-e29b-41d4-a716-446655440001',
  keycloakUserId: 'kc-user-1',
  nom: 'Dupont',
  prenom: 'Jean',
  email: 'jean.dupont@example.com',
  numeroPermis: 'AB-123456',
  categorie: [CategoriePermis.B],
  dateValiditePermis: new Date('2030-12-31'),
  actif: true,
  createdAt: new Date('2026-01-01'),
  assignations: [],
};

const mockExpiredConducteur: Conducteur = {
  ...mockConducteur,
  idConducteur: '550e8400-e29b-41d4-a716-446655440002',
  email: 'expired@example.com',
  numeroPermis: 'EX-999999',
  dateValiditePermis: new Date('2020-01-01'),
};

describe('ConducteursService', () => {
  let service: ConducteursService;
  let repository: jest.Mocked<Repository<Conducteur>>;

  beforeEach(async () => {
    const mockRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      merge: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConducteursService,
        {
          provide: getRepositoryToken(Conducteur),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<ConducteursService>(ConducteursService);
    repository = module.get(getRepositoryToken(Conducteur));
  });

  describe('findAll', () => {
    it('doit retourner la liste des conducteurs actifs', async () => {
      repository.find.mockResolvedValue([mockConducteur]);
      const result = await service.findAll();
      expect(result).toEqual([mockConducteur]);
      expect(repository.find).toHaveBeenCalledWith({
        where: { actif: true },
        order: { nom: 'ASC', prenom: 'ASC' },
      });
    });

    it('doit retourner un tableau vide si aucun conducteur', async () => {
      repository.find.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('doit retourner un conducteur par ID', async () => {
      repository.findOne.mockResolvedValue(mockConducteur);
      const result = await service.findOne(mockConducteur.idConducteur);
      expect(result).toEqual(mockConducteur);
    });

    it('doit lever NotFoundException si conducteur non trouvé', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.findOne('unknown-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto: CreateConducteurDto = {
      nom: 'Martin',
      prenom: 'Pierre',
      email: 'pierre.martin@example.com',
      numeroPermis: 'CD-789012',
      categorie: [CategoriePermis.B, CategoriePermis.C],
      dateValiditePermis: '2029-06-30',
    };

    it('doit créer un nouveau conducteur', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue({ ...mockConducteur, ...createDto } as any);
      repository.save.mockResolvedValue({ ...mockConducteur, ...createDto } as any);

      const result = await service.create(createDto);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: [{ email: createDto.email }, { numeroPermis: createDto.numeroPermis }],
      });
      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('doit lever ConflictException si email déjà utilisé', async () => {
      repository.findOne.mockResolvedValue(mockConducteur);
      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('doit mettre à jour un conducteur existant', async () => {
      const updateDto: UpdateConducteurDto = { nom: 'NouveauNom' };
      repository.findOne.mockResolvedValue(mockConducteur);
      repository.merge.mockReturnValue({ ...mockConducteur, ...updateDto } as any);
      repository.save.mockResolvedValue({ ...mockConducteur, ...updateDto } as any);

      const result = await service.update(mockConducteur.idConducteur, updateDto);
      expect(result.nom).toBe('NouveauNom');
    });

    it('doit lever NotFoundException si conducteur non trouvé', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.update('unknown', { nom: 'Test' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('doit désactiver (soft delete) un conducteur', async () => {
      repository.findOne.mockResolvedValue({ ...mockConducteur });
      repository.save.mockResolvedValue({ ...mockConducteur, actif: false } as any);

      await service.remove(mockConducteur.idConducteur);
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ actif: false }),
      );
    });

    it('doit lever NotFoundException si conducteur non trouvé', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.remove('unknown-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('validerPermis', () => {
    it('doit retourner valide=true pour un permis non expiré', async () => {
      repository.findOne.mockResolvedValue(mockConducteur);
      const result = await service.validerPermis(mockConducteur.idConducteur);
      expect(result.valide).toBe(true);
      expect(result.conducteurId).toBe(mockConducteur.idConducteur);
      expect(result.joursRestants).toBeGreaterThan(0);
    });

    it('doit retourner valide=false pour un permis expiré', async () => {
      repository.findOne.mockResolvedValue(mockExpiredConducteur);
      const result = await service.validerPermis(mockExpiredConducteur.idConducteur);
      expect(result.valide).toBe(false);
      expect(result.joursRestants).toBeLessThan(0);
    });

    it('doit lever NotFoundException si conducteur non trouvé', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.validerPermis('unknown-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAssignations', () => {
    it('doit retourner les assignations du conducteur', async () => {
      repository.findOne.mockResolvedValue(mockConducteur);
      const result = await service.findAssignations(mockConducteur.idConducteur);
      expect(result).toEqual([]);
    });

    it('doit lever NotFoundException si conducteur non trouvé', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.findAssignations('unknown-id')).rejects.toThrow(NotFoundException);
    });
  });
});
