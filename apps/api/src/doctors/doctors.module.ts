import { Module } from '@nestjs/common';
import { DoctorFinanceModule } from '../doctor-finance/doctor-finance.module';
import { FinanceModule } from '../finance/finance.module';
import { MembersModule } from '../members/members.module';
import { ClinicDoctorsController, DoctorsController } from './doctors.controller';
import { DoctorsService } from './doctors.service';
import { DoctorSpecialtiesService } from './specialties.service';

@Module({
  imports: [FinanceModule, MembersModule, DoctorFinanceModule],
  controllers: [DoctorsController, ClinicDoctorsController],
  providers: [DoctorsService, DoctorSpecialtiesService],
  exports: [DoctorsService],
})
export class DoctorsModule {}
