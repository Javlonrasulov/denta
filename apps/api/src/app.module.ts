import { Module, OnModuleInit, Injectable, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AnalyticsModule } from './analytics/analytics.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { AuthModule } from './auth/auth.module';
import { ClinicsModule } from './clinics/clinics.module';
import { CommonAuthModule } from './common/common-auth.module';
import { DoctorsModule } from './doctors/doctors.module';
import { MembersModule } from './members/members.module';
import { AdminModule } from './admin/admin.module';
import { FinanceModule } from './finance/finance.module';
import { InventoryModule } from './inventory/inventory.module';
import { PatientsModule } from './patients/patients.module';
import { RealtimeModule } from './realtime/realtime.module';
import { RoomsModule } from './rooms/rooms.module';
import { ServicesModule } from './services/services.module';
import { SocialModule } from './social/social.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SearchModule } from './search/search.module';
import { GeoModule } from './geo/geo.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import {
  JwtAuthGuard,
  PermissionsGuard,
} from './common/guards/auth.guards';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule, RedisService } from './redis/redis.module';
import { StorageModule } from './storage/storage.module';


@Injectable()
class RedisBootstrap implements OnModuleInit {
  private readonly logger = new Logger(RedisBootstrap.name);
  constructor(private readonly redis: RedisService) {}
  async onModuleInit() {
    await this.redis.init();
    this.logger.log(`Cache/lock backend: ${this.redis.backend}`);
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120,
      },
    ]),
    PrismaModule,
    RedisModule,
    StorageModule,
    CommonAuthModule,
    AuthModule,
    ClinicsModule,
    MembersModule,
    AdminModule,
    AppointmentsModule,
    DoctorsModule,
    PatientsModule,
    FinanceModule,
    InventoryModule,
    RoomsModule,
    ServicesModule,
    AnalyticsModule,
    RealtimeModule,
    SocialModule,
    NotificationsModule,
    SearchModule,
    HealthModule,
    GeoModule,
  ],
  providers: [
    RedisBootstrap,
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
