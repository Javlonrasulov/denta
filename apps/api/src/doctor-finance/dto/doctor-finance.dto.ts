import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

const YMD = /^\d{4}-\d{2}-\d{2}$/;
/** Int4 column ceiling, kept well below 2^31. */
export const MAX_UZS = 2_000_000_000;

export const FINANCE_MODELS = [
  'CLINIC_REVENUE',
  'DOCTOR_REVENUE_PLUS_RENT',
  'REVENUE_SHARE',
  'CUSTOM',
] as const;
export const RECURRENCES = ['DAILY', 'WEEKLY', 'MONTHLY', 'INTERVAL', 'CUSTOM_SCHEDULE', 'ONE_TIME'] as const;
export const PAYMENT_METHODS = ['cash', 'card', 'transfer', 'other'] as const;

export class ScheduleItemDto {
  @Matches(YMD)
  dueDate!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_UZS)
  amountUzs!: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}

export class ServiceShareRuleDto {
  @IsString()
  serviceId!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  clinicPercent!: number;
}

export class RentTermsDto {
  /** Required for every recurrence except CUSTOM_SCHEDULE (amounts live on the items). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_UZS)
  amountUzs?: number;

  @IsIn(RECURRENCES)
  recurrence!: (typeof RECURRENCES)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  intervalValue?: number;

  @IsOptional()
  @IsIn(['DAY', 'WEEK', 'MONTH'])
  intervalUnit?: 'DAY' | 'WEEK' | 'MONTH';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  dueDayOfWeek?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  dueDayOfMonth?: number;

  @IsOptional()
  @IsIn(['CALENDAR_DAYS', 'WORKING_DAYS'])
  dailyBasis?: 'CALENDAR_DAYS' | 'WORKING_DAYS';

  @IsOptional()
  @Matches(YMD)
  oneTimeDueDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(60)
  graceDays?: number;

  @IsOptional()
  @IsBoolean()
  prorateFirstPeriod?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(120)
  @ValidateNested({ each: true })
  @Type(() => ScheduleItemDto)
  scheduleItems?: ScheduleItemDto[];
}

export class OpeningBalanceDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_UZS)
  amountUzs!: number;

  @IsOptional()
  @Matches(YMD)
  asOf?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class PriorPaymentDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_UZS)
  amountUzs!: number;

  @Matches(YMD)
  paidAt!: string;

  @IsOptional()
  @Matches(YMD)
  coveredFrom?: string;

  @IsOptional()
  @Matches(YMD)
  coveredTo?: string;

  @IsOptional()
  @IsIn(PAYMENT_METHODS)
  method?: (typeof PAYMENT_METHODS)[number];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class AgreementInputDto {
  @IsIn(FINANCE_MODELS)
  model!: (typeof FINANCE_MODELS)[number];

  @Matches(YMD)
  effectiveFrom!: string;

  /** Clinic share of real patient payments, percent (0..100, 2 decimals). */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  clinicPercent?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => RentTermsDto)
  rent?: RentTermsDto;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => ServiceShareRuleDto)
  serviceRules?: ServiceShareRuleDto[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class SaveAgreementDto extends AgreementInputDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => OpeningBalanceDto)
  openingBalance?: OpeningBalanceDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PriorPaymentDto)
  priorPayment?: PriorPaymentDto;
}

export class RecordRentPaymentDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_UZS)
  amountUzs!: number;

  @IsOptional()
  @Matches(YMD)
  paidAt?: string;

  @IsIn(PAYMENT_METHODS)
  method!: (typeof PAYMENT_METHODS)[number];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  attachmentUrl?: string;
}

export class PatchRentPaymentDto {
  @IsOptional()
  @IsIn(PAYMENT_METHODS)
  method?: (typeof PAYMENT_METHODS)[number];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  attachmentUrl?: string;
}

export class ReasonDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}

export class ReminderSettingsDto {
  @IsOptional() @IsBoolean() remind3Days?: boolean;
  @IsOptional() @IsBoolean() remind1Day?: boolean;
  @IsOptional() @IsBoolean() remindDueDay?: boolean;
  @IsOptional() @IsBoolean() remindOverdue?: boolean;

  @IsOptional()
  @IsIn(['DAILY', 'EVERY_3_DAYS', 'WEEKLY', 'CUSTOM'])
  overdueFrequency?: 'DAILY' | 'EVERY_3_DAYS' | 'WEEKLY' | 'CUSTOM';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  overdueCustomDays?: number;

  @IsOptional() @IsBoolean() notifyDoctor?: boolean;
  @IsOptional() @IsBoolean() notifyStaff?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(23)
  sendHour?: number;
}

export class OverviewQueryDto {
  @IsOptional()
  @IsIn(['all', 'paid', 'pending', 'debtor', 'overdue', 'not_configured'])
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;
}

export class ReportQueryDto {
  @IsOptional()
  @Matches(YMD)
  from?: string;

  @IsOptional()
  @Matches(YMD)
  to?: string;

  @IsOptional()
  @IsString()
  doctorId?: string;

  @IsOptional()
  @IsIn(['all', 'paid', 'pending', 'debtor', 'overdue'])
  status?: string;
}
