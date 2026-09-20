import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectsService } from './projects.service';
import { Project, ProjectStatus } from './entities/project.entity';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { RedisService } from '../redis/redis.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';

type MockRepository = Partial<Record<keyof Repository<Project>, jest.Mock>>;

const createMockRepository = (): MockRepository => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
  createQueryBuilder: jest.fn(),
});

type MockRedisService = Partial<Record<keyof RedisService, jest.Mock>>;

const createMockRedisService = (): MockRedisService => ({
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  delByPattern: jest.fn().mockResolvedValue(undefined),
});

type MockNotificationsService = Partial<
  Record<keyof NotificationsService, jest.Mock>
>;

const createMockNotificationsService = (): MockNotificationsService => ({
  notifyStatusChange: jest.fn().mockResolvedValue(undefined),
});

type MockAuditService = Partial<Record<keyof AuditService, jest.Mock>>;

const createMockAuditService = (): MockAuditService => ({
  record: jest.fn().mockResolvedValue(undefined),
});

const ACTOR_ID = 'admin-1';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let repository: MockRepository;
  let redisService: MockRedisService;
  let notificationsService: MockNotificationsService;
  let auditService: MockAuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: getRepositoryToken(Project),
          useValue: createMockRepository(),
        },
        {
          provide: RedisService,
          useValue: createMockRedisService(),
        },
        {
          provide: NotificationsService,
          useValue: createMockNotificationsService(),
        },
        {
          provide: AuditService,
          useValue: createMockAuditService(),
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    repository = module.get(getRepositoryToken(Project));
    redisService = module.get(RedisService);
    notificationsService = module.get(NotificationsService);
    auditService = module.get(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('chama o repositório, devolve o projeto criado, invalida o cache e audita', async () => {
      const dto: CreateProjectDto = {
        name: 'Missão Resgate',
        description: 'Resgatar civis em área de risco',
        status: ProjectStatus.PENDING,
        agilidade: 80,
        encantamento: 70,
        eficiencia: 90,
        excelencia: 85,
        transparencia: 95,
        ambicao: 75,
        completion: 0,
        responsibleId: 'user-1',
      };
      const created = { id: 'project-1', ...dto } as Project;

      repository.create!.mockReturnValue(created);
      repository.save!.mockResolvedValue(created);

      const result = await service.create(dto, ACTOR_ID);

      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalledWith(created);
      expect(result).toEqual(created);
      expect(redisService.delByPattern).toHaveBeenCalledWith('projects:*');
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          entidade: 'project',
          entidadeId: 'project-1',
          acao: 'create',
          usuarioId: ACTOR_ID,
        }),
      );
    });
  });

  describe('findAll', () => {
    it('monta a query com os filtros de status e responsável quando não há cache', async () => {
      const projects = [{ id: 'project-1' }] as Project[];
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(projects),
      };
      repository.createQueryBuilder!.mockReturnValue(queryBuilder);

      const result = await service.findAll(ProjectStatus.IN_PROGRESS, 'user-1');

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'project.status = :status',
        { status: ProjectStatus.IN_PROGRESS },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'project.responsibleId = :responsibleId',
        { responsibleId: 'user-1' },
      );
      expect(result).toEqual(projects);
      expect(redisService.set).toHaveBeenCalled();
    });

    it('não aplica filtros quando nenhum é passado', async () => {
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      repository.createQueryBuilder!.mockReturnValue(queryBuilder);

      await service.findAll();

      expect(queryBuilder.andWhere).not.toHaveBeenCalled();
    });

    it('devolve os dados do cache sem consultar o repositório', async () => {
      const cached = [{ id: 'project-1' }];
      redisService.get!.mockResolvedValue(JSON.stringify(cached));

      const result = await service.findAll();

      expect(result).toEqual(cached);
      expect(repository.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('devolve o projeto quando existe', async () => {
      const project = { id: 'project-1', name: 'Missão Resgate' } as Project;
      repository.findOne!.mockResolvedValue(project);

      const result = await service.findOne('project-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'project-1' },
        relations: ['responsible'],
      });
      expect(result).toEqual(project);
    });

    it('lança NotFoundException quando o id não existe', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.findOne('nao-existe')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('aplica só os campos enviados, preserva o resto e invalida o cache', async () => {
      const existing = {
        id: 'project-1',
        name: 'Missão Resgate',
        description: 'Descrição original',
        status: ProjectStatus.PENDING,
        agilidade: 80,
        completion: 0,
      } as Project;

      repository.findOne!.mockResolvedValue(existing);
      repository.save!.mockImplementation((p) => Promise.resolve(p));

      const result = await service.update(
        'project-1',
        { status: ProjectStatus.IN_PROGRESS },
        ACTOR_ID,
      );

      expect(result.status).toBe(ProjectStatus.IN_PROGRESS);
      expect(result.name).toBe('Missão Resgate');
      expect(result.description).toBe('Descrição original');
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'project-1',
          status: ProjectStatus.IN_PROGRESS,
          name: 'Missão Resgate',
        }),
      );
      expect(redisService.delByPattern).toHaveBeenCalledWith('projects:*');
    });

    it('não apaga campos existentes quando o DTO chega com propriedades undefined', async () => {
      const existing = {
        id: 'project-1',
        name: 'Missão Resgate',
        description: 'Descrição original',
        status: ProjectStatus.PENDING,
        agilidade: 80,
        completion: 0,
      } as Project;

      repository.findOne!.mockResolvedValue(existing);
      repository.save!.mockImplementation((p) => Promise.resolve(p));

      const dto = new UpdateProjectDto();
      dto.status = ProjectStatus.IN_PROGRESS;

      const result = await service.update('project-1', dto, ACTOR_ID);

      expect(result.name).toBe('Missão Resgate');
      expect(result.description).toBe('Descrição original');
      expect(result.agilidade).toBe(80);
      expect(result.completion).toBe(0);
    });

    it('registra o diff de auditoria só com os campos alterados', async () => {
      const existing = {
        id: 'project-1',
        name: 'Missão Resgate',
        status: ProjectStatus.PENDING,
      } as Project;

      repository.findOne!.mockResolvedValue(existing);
      repository.save!.mockImplementation((p) => Promise.resolve(p));

      await service.update(
        'project-1',
        { status: ProjectStatus.IN_PROGRESS },
        ACTOR_ID,
      );

      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          entidade: 'project',
          entidadeId: 'project-1',
          acao: 'update',
          usuarioId: ACTOR_ID,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          alteracoes: expect.objectContaining({
            status: {
              de: ProjectStatus.PENDING,
              para: ProjectStatus.IN_PROGRESS,
            },
          }),
        }),
      );
    });

    it('publica evento na fila quando o status muda', async () => {
      const existing = {
        id: 'project-1',
        name: 'Missão Resgate',
        status: ProjectStatus.PENDING,
        responsibleId: 'user-1',
        responsible: { email: 'user@dc.com' },
      } as Project;

      repository.findOne!.mockResolvedValue(existing);
      repository.save!.mockImplementation((p) => Promise.resolve(p));

      await service.update(
        'project-1',
        { status: ProjectStatus.IN_PROGRESS },
        ACTOR_ID,
      );

      expect(notificationsService.notifyStatusChange).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'project-1',
          previousStatus: ProjectStatus.PENDING,
          newStatus: ProjectStatus.IN_PROGRESS,
          responsibleEmail: 'user@dc.com',
        }),
      );
    });

    it('não publica evento quando o status não muda', async () => {
      const existing = {
        id: 'project-1',
        name: 'Missão Resgate',
        status: ProjectStatus.PENDING,
      } as Project;

      repository.findOne!.mockResolvedValue(existing);
      repository.save!.mockImplementation((p) => Promise.resolve(p));

      await service.update('project-1', { name: 'Novo nome' }, ACTOR_ID);

      expect(notificationsService.notifyStatusChange).not.toHaveBeenCalled();
    });

    it('não derruba a atualização quando a fila falha ao publicar', async () => {
      const existing = {
        id: 'project-1',
        name: 'Missão Resgate',
        status: ProjectStatus.PENDING,
      } as Project;

      repository.findOne!.mockResolvedValue(existing);
      repository.save!.mockImplementation((p) => Promise.resolve(p));
      notificationsService.notifyStatusChange!.mockRejectedValue(
        new Error('fila indisponível'),
      );

      const result = await service.update(
        'project-1',
        { status: ProjectStatus.IN_PROGRESS },
        ACTOR_ID,
      );

      expect(result.status).toBe(ProjectStatus.IN_PROGRESS);
    });
  });

  describe('remove', () => {
    it('lança NotFoundException quando o id não existe', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.remove('nao-existe', ACTOR_ID)).rejects.toThrow(
        NotFoundException,
      );
      expect(redisService.delByPattern).not.toHaveBeenCalled();
    });

    it('remove sem erro, invalida o cache e audita', async () => {
      const existing = {
        id: 'project-1',
        name: 'Missão Resgate',
      } as Project;

      repository.findOne!.mockResolvedValue(existing);
      repository.delete!.mockResolvedValue({ affected: 1, raw: [] });

      await expect(
        service.remove('project-1', ACTOR_ID),
      ).resolves.toBeUndefined();
      expect(redisService.delByPattern).toHaveBeenCalledWith('projects:*');
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          entidade: 'project',
          entidadeId: 'project-1',
          acao: 'remove',
          usuarioId: ACTOR_ID,
        }),
      );
    });
  });

  describe('getStatistics', () => {
    it('agrega corretamente por status quando não há cache', async () => {
      repository.count!.mockImplementation(
        (options?: { where: { status: ProjectStatus } }) => {
          if (!options) return Promise.resolve(10);
          switch (options.where.status) {
            case ProjectStatus.PENDING:
              return Promise.resolve(4);
            case ProjectStatus.IN_PROGRESS:
              return Promise.resolve(3);
            case ProjectStatus.COMPLETED:
              return Promise.resolve(3);
            default:
              return Promise.resolve(0);
          }
        },
      );

      const result = await service.getStatistics();

      expect(result).toEqual({
        total: 10,
        pending: 4,
        inProgress: 3,
        completed: 3,
      });
      expect(redisService.set).toHaveBeenCalled();
    });

    it('devolve o resultado do cache sem consultar o repositório', async () => {
      const cached = { total: 5, pending: 1, inProgress: 2, completed: 2 };
      redisService.get!.mockResolvedValue(JSON.stringify(cached));

      const result = await service.getStatistics();

      expect(result).toEqual(cached);
      expect(repository.count).not.toHaveBeenCalled();
    });
  });
});
