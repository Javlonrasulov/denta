import {
  Global,
  Injectable,
  Module,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

type MemoryEntry = { value: string; expiresAt: number | null };

/**
 * Redis-backed cache/locks with an in-memory fallback for local DEV
 * when Redis is unreachable. Production should always use real Redis.
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private mode: 'redis' | 'memory' = 'memory';
  private readonly memory = new Map<string, MemoryEntry>();
  private readonly isProd: boolean;
  private readonly url: string;

  constructor(config: ConfigService) {
    this.isProd = config.get<string>('app.nodeEnv') === 'production';
    this.url =
      config.get<string>('app.redisUrl') ?? 'redis://localhost:6379';
    const enabled = config.get<boolean>('app.redisEnabled') !== false;

    if (!enabled) {
      this.logger.warn(
        'REDIS_ENABLED=false — using in-memory fallback (dev only)',
      );
      this.mode = 'memory';
      if (this.isProd) {
        throw new Error('Redis is required in production (REDIS_ENABLED=false)');
      }
      return;
    }

    this.client = new Redis(this.url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      lazyConnect: true,
      enableOfflineQueue: false,
    });
    this.client.on('error', (err) => {
      this.logger.warn(`Redis error: ${err.message}`);
    });
  }

  /** Call once on bootstrap to prefer Redis when available. */
  async init(): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.connect();
      const pong = await this.client.ping();
      if (pong === 'PONG') {
        this.mode = 'redis';
        this.logger.log(`Redis connected (${this.url})`);
        return;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (this.isProd) {
        throw new Error(`Redis required in production but unavailable: ${msg}`);
      }
      this.logger.warn(
        `Redis unavailable (${msg}) — using in-memory fallback for development`,
      );
      this.mode = 'memory';
      try {
        this.client.disconnect();
      } catch {
        /* ignore */
      }
      this.client = null;
    }
  }

  get backend(): 'redis' | 'memory' {
    return this.mode;
  }

  async ping(): Promise<boolean> {
    if (this.mode === 'memory') return true;
    try {
      const res = await this.client!.ping();
      return res === 'PONG';
    } catch {
      return false;
    }
  }

  async acquireLock(
    key: string,
    ttlMs: number,
    token: string,
  ): Promise<boolean> {
    if (this.mode === 'memory') {
      this.purgeExpired();
      const existing = this.memory.get(key);
      if (existing && (existing.expiresAt === null || existing.expiresAt > Date.now())) {
        return false;
      }
      this.memory.set(key, {
        value: token,
        expiresAt: Date.now() + ttlMs,
      });
      return true;
    }
    const result = await this.client!.set(key, token, 'PX', ttlMs, 'NX');
    return result === 'OK';
  }

  async releaseLock(key: string, token: string): Promise<void> {
    if (this.mode === 'memory') {
      const existing = this.memory.get(key);
      if (existing?.value === token) this.memory.delete(key);
      return;
    }
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    await this.client!.eval(script, 1, key, token);
  }

  async get(key: string): Promise<string | null> {
    if (this.mode === 'memory') {
      this.purgeExpired();
      return this.memory.get(key)?.value ?? null;
    }
    return this.client!.get(key);
  }

  async set(key: string, value: string, ttlMs?: number): Promise<void> {
    if (this.mode === 'memory') {
      this.memory.set(key, {
        value,
        expiresAt: ttlMs ? Date.now() + ttlMs : null,
      });
      return;
    }
    if (ttlMs) {
      await this.client!.set(key, value, 'PX', ttlMs);
    } else {
      await this.client!.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    if (this.mode === 'memory') {
      this.memory.delete(key);
      return;
    }
    await this.client!.del(key);
  }

  private purgeExpired() {
    const now = Date.now();
    for (const [k, v] of this.memory) {
      if (v.expiresAt !== null && v.expiresAt <= now) this.memory.delete(k);
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => undefined);
    }
  }
}

@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
