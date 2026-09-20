import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { AppointmentSource } from '@prisma/client';

export class DoctorSlotsQueryDto {
  @IsOptional()
  @IsString()
  clinicId?: string;

  @IsOptional()
  @IsString()
  serviceId?: string;

  @IsDateString()
  date!: string; // YYYY-MM-DD
}

export class GetSlotsQueryDto extends DoctorSlotsQueryDto {
  @IsString()
  doctorId!: string;
}

export class CreateAppointmentDto {
  @IsString()
  doctorId!: string;

  @IsString()
  clinicId!: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsString()
  serviceId!: string;

  @IsOptional()
  @IsString()
  patientId?: string;

  @IsDateString()
  date!: string;

  @Matches(/^\d{2}:\d{2}$/)
  time!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(AppointmentSource)
  source?: AppointmentSource;
}

export class ListAppointmentsQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  doctorId?: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}

export class CancelAppointmentDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  reason?: string;
}

export class RescheduleAppointmentDto {
  @IsDateString()
  date!: string;

  @Matches(/^\d{2}:\d{2}$/)
  time!: string;
}

export class UpdateAppointmentStatusDto {
  @IsIn(['IN_PROGRESS', 'COMPLETED', 'NO_SHOW', 'CONFIRMED'])
  status!: 'IN_PROGRESS' | 'COMPLETED' | 'NO_SHOW' | 'CONFIRMED';
}
