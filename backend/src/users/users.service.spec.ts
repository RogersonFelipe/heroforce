import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { AuditService } from '../audit/audit.service';

type MockRepository = Partial<Record<keyof Repository<User>, jest.Mock>>;

const createMockRepository = (): MockRepository => ({
  find: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
});

type MockAuditService = Partial<Record<keyof AuditService, jest.Mock>>;

const createMockAuditService = (): MockAuditService => ({
  record: jest.fn().mockResolvedValue(undefined),
});

const ACTOR_ID = 'admin-1';

describe('UsersService', () => {
  let service: UsersService;
  let repository: MockRepository;
  let auditService: MockAuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepository(),
        },
        {
          provide: AuditService,
          useValue: createMockAuditService(),
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(getRepositoryToken(User));
    auditService = module.get(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('devolve a lista de usuários sem o campo senha', async () => {
      const users = [
        { id: 'user-1', name: 'Bruce Wayne', email: 'bruce@dc.com' },
      ] as User[];
      repository.find!.mockResolvedValue(users);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        select: ['id', 'name', 'email', 'character', 'role', 'createdAt'],
      });
      expect(result).toEqual(users);
    });
  });

  describe('findOne', () => {
    it('devolve o usuário quando existe', async () => {
      const user = { id: 'user-1', name: 'Bruce Wayne' } as User;
      repository.findOne!.mockResolvedValue(user);

      const result = await service.findOne('user-1');

      expect(result).toEqual(user);
    });

    it('lança NotFoundException quando o id não existe', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.findOne('nao-existe')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByEmail', () => {
    it('devolve o usuário quando o e-mail existe', async () => {
      const user = { id: 'user-1', email: 'bruce@dc.com' } as User;
      repository.findOne!.mockResolvedValue(user);

      const result = await service.findByEmail('bruce@dc.com');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'bruce@dc.com' },
      });
      expect(result).toEqual(user);
    });

    it('devolve null quando o e-mail não existe', async () => {
      repository.findOne!.mockResolvedValue(null);

      const result = await service.findByEmail('ninguem@dc.com');

      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('lança NotFoundException quando o id não existe', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.remove('nao-existe', ACTOR_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('remove sem erro quando o id existe e audita', async () => {
      const existing = {
        id: 'user-1',
        name: 'Bruce Wayne',
        email: 'bruce@dc.com',
        character: 'Batman',
        role: 'hero',
      } as User;

      repository.findOne!.mockResolvedValue(existing);
      repository.delete!.mockResolvedValue({ affected: 1, raw: [] });

      await expect(service.remove('user-1', ACTOR_ID)).resolves.toBeUndefined();
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          entidade: 'user',
          entidadeId: 'user-1',
          acao: 'remove',
          usuarioId: ACTOR_ID,
        }),
      );
    });
  });
});
