import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/guards/auth.guards';
import {
  Public,
  RequirePermissions,
} from '../common/guards/auth.guards';
import { AppError } from '../common/filters/global-exception.filter';
import { ClinicsService } from './clinics.service';
import {
  CreateClinicBranchDto,
  NearbyClinicsQueryDto,
  PublishClinicDto,
  SearchClinicsQueryDto,
  UpdateClinicProfileDto,
} from './dto/clinics.dto';

@ApiTags('clinics')
@Controller('clinics')
export class ClinicsController {
  constructor(private readonly clinics: ClinicsService) {}

  @Public()
  @Get()
  search(@Query() query: SearchClinicsQueryDto) {
    return this.clinics.search(query);
  }

  @Public()
  @Get('nearby')
  nearby(@Query() query: NearbyClinicsQueryDto) {
    return this.clinics.nearby(query);
  }

  @ApiBearerAuth()
  @RequirePermissions('clinic:read')
  @Get('me')
  myClinic(@CurrentUser() user: AuthUser) {
    if (!user.clinicId) {
      throw new AppError('UNAUTHORIZED', 'No clinic context', 401);
    }
    return this.clinics.getMyClinic(user.clinicId);
  }

  @ApiBearerAuth()
  @RequirePermissions('clinic:update')
  @Patch('me')
  updateMe(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateClinicProfileDto,
  ) {
    if (!user.clinicId) {
      throw new AppError('UNAUTHORIZED', 'No clinic context', 401);
    }
    return this.clinics.updateProfile(user.clinicId, dto);
  }

  @ApiBearerAuth()
  @RequirePermissions('clinic:update')
  @Post('me/publish')
  publish(@CurrentUser() user: AuthUser, @Body() dto: PublishClinicDto) {
    if (!user.clinicId) {
      throw new AppError('UNAUTHORIZED', 'No clinic context', 401);
    }
    return this.clinics.publish(user.clinicId, dto);
  }

  @ApiBearerAuth()
  @RequirePermissions('clinic:update')
  @Get('me/branches')
  myBranches(@CurrentUser() user: AuthUser) {
    if (!user.clinicId) {
      throw new AppError('UNAUTHORIZED', 'No clinic context', 401);
    }
    return this.clinics.listMyBranches(user.clinicId);
  }

  @ApiBearerAuth()
  @RequirePermissions('clinic:update')
  @Post('me/branches')
  addBranch(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateClinicBranchDto,
  ) {
    if (!user.clinicId) {
      throw new AppError('UNAUTHORIZED', 'No clinic context', 401);
    }
    return this.clinics.addBranch(user.clinicId, dto);
  }

  @Public()
  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.clinics.getById(id);
  }
}
