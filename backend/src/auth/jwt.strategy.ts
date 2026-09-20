import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
import { RedisService } from '../redis/redis.service';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  jti: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'im-batman',
    });
  }

  async validate(payload: JwtPayload) {
    const isBlacklisted = await this.redisService.exists(
      `blacklist:${payload.jti}`,
    );

    if (isBlacklisted) {
      throw new UnauthorizedException('Token revogado');
    }

    const user = await this.authService.validateUser(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Token inválido');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      character: user.character,
    };
  }
}
