import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AppError } from '../common/filters/global-exception.filter';
import type { AuthUser } from '../common/guards/auth.guards';
import { Public, RequirePermissions } from '../common/guards/auth.guards';
import { ServicesService } from './services.service';

class ClinicServiceSetupItemDto {
  @IsString()
  serviceId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceUzs?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  customName?: string;
}

class SetupClinicServicesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClinicServiceSetupItemDto)
  services!: ClinicServiceSetupItemDto[];
}

class UpsertClinicServiceDto {
  @IsString()
  serviceId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceUzs!: number;

  @Type(() => Number)
  @IsInt()
  @Min(5)
  durationMinutes!: number;

  @IsOptional()
  @IsString()
  customName?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private readonly services: ServicesService) {}

  private clinicId(user: AuthUser): string {
    if (!user.clinicId) {
      throw new AppError('UNAUTHORIZED', 'No clinic context', 401);
    }
    return user.clinicId;
  }

  private locale(acceptLanguage?: string): string {
    if (!acceptLanguage) return 'uz';
    const primary = acceptLanguage.split(',')[0]?.trim() ?? 'uz';
    return primary.split(';')[0]?.trim() || 'uz';
  }

  @Public()
  @Get('catalog')
  catalog(@Headers('accept-language') acceptLanguage?: string) {
    return this.services.catalog(this.locale(acceptLanguage));
  }

  @ApiBearerAuth()
  @RequirePermissions('clinic:read')
  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    return this.services.list(this.clinicId(user), this.locale(acceptLanguage));
  }

  @ApiBearerAuth()
  @RequirePermissions('clinic:update')
  @Post('setup')
  setup(
    @CurrentUser() user: AuthUser,
    @Body() dto: SetupClinicServicesDto,
  ) {
    return this.services.setupClinicServices(
      this.clinicId(user),
      dto.services ?? [],
    );
  }

  @ApiBearerAuth()
  @RequirePermissions('clinic:update')
  @Put()
  upsert(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpsertClinicServiceDto,
  ) {
    return this.services.upsertClinicService(this.clinicId(user), dto);
  }
}
