import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;
  private available = true;

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => Math.min(times * 200, 2000),
    });

    this.client.on('error', (err) => {
      if (this.available) {
        this.logger.warn(
          `Redis indisponível, aplicação segue sem cache/rate-limit: ${err.message}`,
        );
      }
      this.available = false;
    });

    this.client.on('ready', () => {
      if (!this.available) {
        this.logger.log('Conexão com o Redis restabelecida');
      }
      this.available = true;
    });
  }

  isAvailable(): boolean {
    return this.available;
  }

  async get(key: string): Promise<string | null> {
    if (!this.available) return null;
    try {
      return await this.client.get(key);
    } catch (err) {
      this.logger.warn(`Falha ao ler "${key}": ${(err as Error).message}`);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.available) return;
    try {
      if (ttlSeconds && ttlSeconds > 0) {
        await this.client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
    } catch (err) {
      this.logger.warn(`Falha ao gravar "${key}": ${(err as Error).message}`);
    }
  }

  /** Remove todas as chaves que casam com o padrão (ex: "projects:*"). */
  async delByPattern(pattern: string): Promise<void> {
    if (!this.available) return;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (err) {
      this.logger.warn(
        `Falha ao invalidar "${pattern}": ${(err as Error).message}`,
      );
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.available) return false;
    try {
      return (await this.client.exists(key)) === 1;
    } catch (err) {
      this.logger.warn(
        `Falha ao consultar "${key}": ${(err as Error).message}`,
      );
      return false;
    }
  }

  /** Incrementa um contador, definindo TTL apenas na primeira ocorrência. Retorna 0 se o Redis estiver indisponível (fail-open). */
  async incrementWithExpiry(key: string, ttlSeconds: number): Promise<number> {
    if (!this.available) return 0;
    try {
      const count = await this.client.incr(key);
      if (count === 1) {
        await this.client.expire(key, ttlSeconds);
      }
      return count;
    } catch (err) {
      this.logger.warn(
        `Falha ao incrementar "${key}": ${(err as Error).message}`,
      );
      return 0;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit().catch(() => undefined);
  }
}
