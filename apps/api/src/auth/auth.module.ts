import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LegalModule } from '../legal/legal.module';
import { MailModule } from '../mail/mail.module';
import { AuthController } from './auth.controller';
import { AppActivityService } from './app-activity.service';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { SubscriptionController } from '../subscription/subscription.controller';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('app.jwt.accessSecret'),
      }),
    }),
    MailModule,
    LegalModule,
  ],
  controllers: [AuthController, SubscriptionController],
  providers: [AuthService, JwtStrategy, AppActivityService],
  exports: [AuthService],
})
export class AuthModule {}
