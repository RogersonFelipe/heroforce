import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { CreateUserDto } from './dto/auth.dto';
import { RedisService } from '../redis/redis.service';

jest.mock('bcrypt');

type MockRepository = Partial<Record<keyof Repository<User>, jest.Mock>>;

const createMockRepository = (): MockRepository => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

type MockRedisService = Partial<Record<keyof RedisService, jest.Mock>>;

const createMockRedisService = (): MockRedisService => ({
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  exists: jest.fn().mockResolvedValue(false),
  incrementWithExpiry: jest.fn().mockResolvedValue(1),
});

describe('AuthService', () => {
  let service: AuthService;
  let repository: MockRepository;
  let redisService: MockRedisService;
  let jwtService: { sign: jest.Mock; decode: jest.Mock };

  beforeEach(async () => {
    jwtService = {
      sign: jest.fn().mockReturnValue('token-fake'),
      decode: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepository(),
        },
        { provide: JwtService, useValue: jwtService },
        { provide: RedisService, useValue: createMockRedisService() },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    repository = module.get(getRepositoryToken(User));
    redisService = module.get(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const dto: CreateUserDto = {
      name: 'Bruce Wayne',
      email: 'bruce@dc.com',
      character: 'Batman',
      password: 'senha123',
      role: 'hero',
    };

    it('grava a senha com hash, nunca em texto plano', async () => {
      repository.findOne!.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hash-fake');
      repository.create!.mockImplementation((data: Partial<User>) => data);
      repository.save!.mockImplementation((user) =>
        Promise.resolve({ id: 'user-1', ...user }),
      );

      await service.register(dto);

      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ password: 'hash-fake' }),
      );
      const saveMock = repository.save as jest.Mock<
        Promise<User>,
        [Partial<User>]
      >;
      const savedUser = saveMock.mock.calls[0][0];
      expect(savedUser.password).not.toBe(dto.password);
    });

    it('e-mail duplicado é rejeitado', async () => {
      repository.findOne!.mockResolvedValue({
        id: 'existing',
        email: dto.email,
      });

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const user = {
      id: 'user-1',
      email: 'bruce@dc.com',
      password: 'hash-fake',
      name: 'Bruce Wayne',
      character: 'Batman',
      role: 'hero',
    } as User;

    it('credencial válida devolve token', async () => {
      repository.findOne!.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: user.email,
        password: 'senha123',
      });

      expect(result.access_token).toBe('token-fake');
      expect(result.user.email).toBe(user.email);
    });

    it('senha errada lança UnauthorizedException', async () => {
      repository.findOne!.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: user.email, password: 'errada' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('e-mail inexistente lança UnauthorizedException', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(
        service.login({ email: 'ninguem@dc.com', password: 'senha123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('bloqueia a sexta tentativa em um minuto para o mesmo e-mail', async () => {
      repository.findOne!.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      redisService.incrementWithExpiry!.mockResolvedValue(6);

      await expect(
        service.login({ email: user.email, password: 'senha123' }),
      ).rejects.toThrow(HttpException);
    });

    it('bloqueia a sexta tentativa em um minuto para o mesmo IP', async () => {
      repository.findOne!.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      redisService
        .incrementWithExpiry!.mockResolvedValueOnce(1) // contador por e-mail
        .mockResolvedValueOnce(6); // contador por IP

      await expect(
        service.login({ email: user.email, password: 'senha123' }, '10.0.0.1'),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('logout', () => {
    it('coloca o jti do token na blacklist com o TTL restante', async () => {
      const exp = Math.floor(Date.now() / 1000) + 3600;
      jwtService.decode.mockReturnValue({ jti: 'token-jti', exp });

      await service.logout('algum-token');

      expect(redisService.set).toHaveBeenCalledWith(
        'blacklist:token-jti',
        '1',
        expect.any(Number),
      );
    });

    it('não grava nada quando o token não tem jti', async () => {
      jwtService.decode.mockReturnValue({});

      await service.logout('token-sem-jti');

      expect(redisService.set).not.toHaveBeenCalled();
    });
  });

  describe('validateUser', () => {
    it('devolve o usuário quando existe', async () => {
      const user = { id: 'user-1', email: 'bruce@dc.com' } as User;
      repository.findOne!.mockResolvedValue(user);

      const result = await service.validateUser('user-1');

      expect(result).toEqual(user);
    });

    it('lança UnauthorizedException quando o usuário não existe', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.validateUser('nao-existe')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
