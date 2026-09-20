import { IsEnum, IsOptional } from 'class-validator';

export type PatientFlowPeriod = '7d' | '30d' | '3m' | '12m';

export class PatientFlowQueryDto {
  @IsOptional()
  @IsEnum(['7d', '30d', '3m', '12m'])
  period?: PatientFlowPeriod;
}
