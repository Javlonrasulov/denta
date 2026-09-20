import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ListPatientsQueryDto {
  @IsOptional()
  @IsString()
  q?: string;
}

export class CreatePatientDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  lastName!: string;

  @IsString()
  phone!: string;

  @IsString()
  birthDate!: string;

  @IsEnum(['male', 'female'])
  gender!: 'male' | 'female';

  @IsOptional()
  @IsString()
  notes?: string;
}

export class PatchPatientNotesDto {
  @IsString()
  notes!: string;
}

export class ToothRecordDto {
  @Type(() => Number)
  @IsInt()
  toothNumber!: number;

  @IsString()
  condition!: string;

  @IsOptional()
  @IsString()
  treatment?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateOdontogramDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ToothRecordDto)
  teeth!: ToothRecordDto[];
}
