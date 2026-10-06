import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { DoctorFinanceController, MyClinicFinanceController } from './doctor-finance.controller';
import { DoctorFinanceJobs } from './doctor-finance.jobs';
import { DoctorFinanceService } from './doctor-finance.service';
import { RevenueShareService } from './revenue-share.service';

@Module({
  imports: [NotificationsModule],
  controllers: [DoctorFinanceController, MyClinicFinanceController],
  providers: [DoctorFinanceService, DoctorFinanceJobs, RevenueShareService],
  exports: [DoctorFinanceService, DoctorFinanceJobs, RevenueShareService],
})
export class DoctorFinanceModule {}
