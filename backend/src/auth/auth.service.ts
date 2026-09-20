import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { User } from '../users/entities/user.entity';
import { CreateUserDto, LoginDto } from './dto/auth.dto';
import { RedisService } from '../redis/redis.service';

const LOGIN_RATE_LIMIT_WINDOW_SECONDS = 60;
const LOGIN_RATE_LIMIT_MAX_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private redisService: RedisService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const { email, password, name, character, role } = createUserDto;

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      name,
      email,
      character,
      password: hashedPassword,
      role,
    });

    await this.userRepository.save(user);

    const access_token = this.signToken(user);

    return {
      access_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        character: user.character,
        role: user.role,
      },
    };
  }

  async login(loginDto: LoginDto, ip?: string) {
    const { email, password } = loginDto;

    await this.enforceLoginRateLimit(email, ip);

    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const access_token = this.signToken(user);

    return {
      access_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        character: user.character,
        role: user.role,
      },
    };
  }

  async logout(token: string): Promise<void> {
    const decoded: { jti?: string; exp?: number } | null =
      this.jwtService.decode(token);

    if (!decoded?.jti || !decoded.exp) {
      return;
    }

    const ttlSeconds = decoded.exp - Math.floor(Date.now() / 1000);
    if (ttlSeconds > 0) {
      await this.redisService.set(`blacklist:${decoded.jti}`, '1', ttlSeconds);
    }
  }

  async validateUser(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    return user;
  }

  private signToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      jti: randomUUID(),
    };
    return this.jwtService.sign(payload);
  }

  private async enforceLoginRateLimit(email: string, ip?: string) {
    const emailAttempts = await this.redisService.incrementWithExpiry(
      `login-attempts:email:${email}`,
      LOGIN_RATE_LIMIT_WINDOW_SECONDS,
    );

    if (emailAttempts > LOGIN_RATE_LIMIT_MAX_ATTEMPTS) {
      throw new HttpException(
        'Muitas tentativas de login. Tente novamente em instantes.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (!ip) {
      return;
    }

    const ipAttempts = await this.redisService.incrementWithExpiry(
      `login-attempts:ip:${ip}`,
      LOGIN_RATE_LIMIT_WINDOW_SECONDS,
    );

    if (ipAttempts > LOGIN_RATE_LIMIT_MAX_ATTEMPTS) {
      throw new HttpException(
        'Muitas tentativas de login. Tente novamente em instantes.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}
