import { Module } from '@nestjs/common';
import { DoctorFinanceModule } from '../doctor-finance/doctor-finance.module';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';

@Module({
  imports: [DoctorFinanceModule],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
