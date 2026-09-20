import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AuditService } from './audit.service';
import { AuditLog } from './schemas/audit-log.schema';

const createMockModel = () => ({
  create: jest.fn(),
  find: jest.fn(),
});

describe('AuditService', () => {
  let service: AuditService;
  let model: ReturnType<typeof createMockModel>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getModelToken(AuditLog.name),
          useValue: createMockModel(),
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    model = module.get(getModelToken(AuditLog.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('record', () => {
    it('grava o registro com a data de ocorrência', async () => {
      model.create.mockResolvedValue({});

      await service.record({
        entidade: 'project',
        entidadeId: 'project-1',
        acao: 'update',
        usuarioId: 'user-1',
        alteracoes: { status: { de: 'pendente', para: 'em andamento' } },
      });

      expect(model.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entidade: 'project',
          entidadeId: 'project-1',
          acao: 'update',
          usuarioId: 'user-1',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          ocorridoEm: expect.any(Date),
        }),
      );
    });

    it('não propaga o erro quando a gravação falha', async () => {
      model.create.mockRejectedValue(new Error('mongo indisponível'));

      await expect(
        service.record({
          entidade: 'project',
          entidadeId: 'project-1',
          acao: 'create',
          usuarioId: 'user-1',
          alteracoes: {},
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('query', () => {
    const buildQueryChain = (result: unknown[]) => {
      const chain = {
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(result),
      };
      return chain;
    };

    it('filtra por entidade, usuário e período', async () => {
      const chain = buildQueryChain([]);
      model.find.mockReturnValue(chain);

      await service.query({
        entidade: 'project',
        usuarioId: 'user-1',
        dataInicio: '2026-01-01T00:00:00.000Z',
        dataFim: '2026-01-31T23:59:59.000Z',
      });

      expect(model.find).toHaveBeenCalledWith(
        expect.objectContaining({
          entidade: 'project',
          usuarioId: 'user-1',
          ocorridoEm: {
            $gte: new Date('2026-01-01T00:00:00.000Z'),
            $lte: new Date('2026-01-31T23:59:59.000Z'),
          },
        }),
      );
      expect(chain.sort).toHaveBeenCalledWith({ ocorridoEm: 1 });
    });

    it('devolve lista vazia de filtros quando nada é informado', async () => {
      const chain = buildQueryChain([]);
      model.find.mockReturnValue(chain);

      await service.query({});

      expect(model.find).toHaveBeenCalledWith({});
    });
  });
});
