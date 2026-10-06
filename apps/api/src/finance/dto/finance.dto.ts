import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export type FinancePeriod = 'today' | 'week' | 'month' | 'year';

export const EXPENSE_CATEGORIES = [
  'rent',
  'salary',
  'materials',
  'equipment',
  'utilities',
  'marketing',
  'taxes',
  'other',
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

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

  @IsOptional()
  @IsString()
  @MaxLength(200)
  serviceName?: string;

  @IsOptional()
  @IsIn(EXPENSE_CATEGORIES)
  category?: ExpenseCategory;

  @IsOptional()
  @IsString()
  categoryId?: string;

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
  @MaxLength(1000)
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

export class RefundPaymentDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  amount!: number;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}

export class CreateExpenseCategoryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name!: string;
}

export class ListChargesQueryDto {
  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
