import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/guards/auth.guards';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.module';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Get()
  live() {
    return { status: 'ok' };
  }

  @Public()
  @Get('ready')
  async ready() {
    let db = false;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      db = true;
    } catch {
      db = false;
    }

    const redisOk = await this.redis.ping();
    const redisBackend = this.redis.backend;
    const isProd = this.config.get<string>('app.nodeEnv') === 'production';

    // Postgres is always required. Redis real connection required only in production.
    const ok = db && (isProd ? redisBackend === 'redis' && redisOk : true);

    return {
      status: ok ? 'ready' : 'degraded',
      checks: {
        postgres: db,
        redis: redisOk,
        redisBackend,
        storage: this.config.get<string>('app.storage.driver') ?? 'local',
      },
    };
  }
}
