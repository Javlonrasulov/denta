import { Module } from '@nestjs/common';
import { RealtimeModule } from '../realtime/realtime.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';

@Module({
  imports: [RealtimeModule],
  controllers: [NotificationsController],
  providers: [PushService, NotificationsService],
  exports: [PushService, NotificationsService],
})
export class NotificationsModule {}
