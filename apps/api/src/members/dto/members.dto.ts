import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { PermissionEffect, UserRole } from '@prisma/client';

export class PermissionOverrideDto {
  @IsString()
  permission!: string;

  @IsEnum(PermissionEffect)
  effect!: PermissionEffect;
}

export class LookupMemberDto {
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class CreateMemberDto {
  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsString()
  @MinLength(1)
  lastName!: string;

  @IsString()
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsEnum(UserRole)
  role!: UserRole;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionOverrideDto)
  @ArrayMaxSize(50)
  permissions?: PermissionOverrideDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(50)
  serviceIds?: string[];
}

export class UpdateMemberDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  specialty?: string;
}

export class UpdateMemberPermissionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionOverrideDto)
  @ArrayMaxSize(50)
  permissions!: PermissionOverrideDto[];
}

export class AcceptInvitationDto {
  @IsString()
  @MinLength(8)
  password!: string;
}
