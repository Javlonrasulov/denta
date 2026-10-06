import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterClinicDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  clinicName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  adminFirstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  adminLastName!: string;

  @IsString()
  phone!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  /** Only a literal JSON `true` counts as consent; anything else → LEGAL_CONSENT_REQUIRED. */
  @IsOptional()
  @Transform(({ obj }) => (obj as { acceptTerms?: unknown }).acceptTerms === true)
  @IsBoolean()
  acceptTerms?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  termsVersion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  privacyVersion?: string;

  @IsOptional()
  @IsString()
  locale?: string;
}

export class VerifyEmailDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Matches(/^\d{6}$/)
  code!: string;
}

export class ResendEmailDto {
  @IsEmail()
  email!: string;
}

export class LoginDto {
  @IsString()
  @MinLength(3)
  identifier!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Matches(/^\d{6}$/)
  code!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}

export class VerifyResetCodeDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Matches(/^\d{6}$/)
  code!: string;
}

export class OnboardingDto {
  @IsInt()
  @Min(0)
  @Max(20)
  step!: number;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}

export class RefreshTokenDto {
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class RegisterPatientDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  phone!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

export class UpdatePatientProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  gender?: 'MALE' | 'FEMALE';

  @IsOptional()
  @IsString()
  birthDate?: string;
}

export class CheckEmailDto {
  @IsString()
  @MinLength(3)
  @MaxLength(254)
  email!: string;
}

export class UpdateLocaleDto {
  @IsIn(['uz', 'uz-Cyrl', 'ru', 'en'])
  locale!: 'uz' | 'uz-Cyrl' | 'ru' | 'en';
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  @MaxLength(256)
  currentPassword!: string;

  @IsString()
  @MaxLength(256)
  newPassword!: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class ChangePhoneDto {
  @IsString()
  @MaxLength(32)
  phone!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(256)
  currentPassword!: string;
}

export class RequestEmailChangeDto {
  @IsString()
  @MaxLength(254)
  newEmail!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(256)
  currentPassword!: string;
}

export class ConfirmEmailChangeDto {
  @IsString()
  @MaxLength(254)
  newEmail!: string;

  @IsString()
  @Matches(/^\d{6}$/)
  code!: string;
}
