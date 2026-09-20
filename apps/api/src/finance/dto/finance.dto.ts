import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export type FinancePeriod = 'today' | 'week' | 'month' | 'year';

export class FinancePeriodQueryDto {
  @IsOptional()
  @IsEnum(['today', 'week', 'month', 'year'])
  period?: FinancePeriod;
}

export class CreateFinanceRecordDto {
  @IsEnum(['income', 'expense'])
  type!: 'income' | 'expense';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  amount!: number;

  @IsString()
  serviceName!: string;

  @IsOptional()
  @IsString()
  patientName?: string;

  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @IsString()
  doctorName?: string;

  @IsOptional()
  @IsString()
  doctorId?: string;

  @IsOptional()
  @IsString()
  appointmentId?: string;

  @IsOptional()
  @IsString()
  chargeId?: string;

  @IsOptional()
  @IsEnum(['paid', 'pending', 'overdue', 'partial', 'cancelled'])
  paymentStatus?: 'paid' | 'pending' | 'overdue' | 'partial' | 'cancelled';

  @IsOptional()
  @IsEnum(['card', 'cash', 'transfer', 'other'])
  paymentMethod?: 'card' | 'cash' | 'transfer' | 'other';

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  date?: string;
}

export class PatchFinanceRecordDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  amount?: number;

  @IsOptional()
  @IsString()
  serviceName?: string;

  @IsOptional()
  @IsEnum(['paid', 'pending', 'overdue', 'partial', 'cancelled'])
  paymentStatus?: 'paid' | 'pending' | 'overdue' | 'partial' | 'cancelled';

  @IsOptional()
  @IsEnum(['card', 'cash', 'transfer', 'other'])
  paymentMethod?: 'card' | 'cash' | 'transfer' | 'other';

  @IsOptional()
  @IsString()
  notes?: string;
}

export class RecordChargePaymentDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  amount!: number;

  @IsOptional()
  @IsEnum(['card', 'cash', 'transfer', 'other'])
  method?: 'card' | 'cash' | 'transfer' | 'other';

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ListChargesQueryDto {
  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
