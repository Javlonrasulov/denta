import { Module } from '@nestjs/common';
import { FinanceModule } from '../finance/finance.module';
import { MembersModule } from '../members/members.module';
import { ClinicDoctorsController, DoctorsController } from './doctors.controller';
import { DoctorsService } from './doctors.service';

@Module({
  imports: [FinanceModule, MembersModule],
  controllers: [DoctorsController, ClinicDoctorsController],
  providers: [DoctorsService],
  exports: [DoctorsService],
})
export class DoctorsModule {}
