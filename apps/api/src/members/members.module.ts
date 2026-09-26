import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { InvitationsController, MembersController } from './members.controller';
import { MembersService } from './members.service';

@Module({
  imports: [MailModule],
  controllers: [MembersController, InvitationsController],
  providers: [MembersService],
  exports: [MembersService],
})
export class MembersModule {}
