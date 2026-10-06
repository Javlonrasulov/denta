import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
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
  WorkingHoursPreviewDto,
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
  @RequirePermissions('settings:manage')
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
  @RequirePermissions('settings:manage')
  @Post('me/working-hours/conflicts')
  scheduleConflicts(
    @CurrentUser() user: AuthUser,
    @Body() dto: WorkingHoursPreviewDto,
  ) {
    if (!user.clinicId) {
      throw new AppError('UNAUTHORIZED', 'No clinic context', 401);
    }
    return this.clinics.previewScheduleConflicts(user.clinicId, dto.workingHours);
  }

  @ApiBearerAuth()
  @RequirePermissions('settings:manage')
  @Post('me/media/:kind')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5_242_880 },
    }),
  )
  uploadMedia(
    @CurrentUser() user: AuthUser,
    @Param('kind') kind: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!user.clinicId) {
      throw new AppError('UNAUTHORIZED', 'No clinic context', 401);
    }
    if (kind !== 'logo' && kind !== 'cover') {
      throw new AppError('VALIDATION_ERROR', 'kind must be logo or cover', 400);
    }
    if (!file) {
      throw new AppError('INVALID_FILE', 'file is required', 400);
    }
    return this.clinics.uploadMedia(user.clinicId, kind, {
      buffer: file.buffer,
      mimetype: file.mimetype,
      size: file.size,
      originalname: file.originalname,
    });
  }

  @ApiBearerAuth()
  @RequirePermissions('settings:manage')
  @Post('me/publish')
  publish(@CurrentUser() user: AuthUser, @Body() dto: PublishClinicDto) {
    if (!user.clinicId) {
      throw new AppError('UNAUTHORIZED', 'No clinic context', 401);
    }
    return this.clinics.publish(user.clinicId, dto);
  }

  @ApiBearerAuth()
  @RequirePermissions('settings:manage')
  @Get('me/branches')
  myBranches(@CurrentUser() user: AuthUser) {
    if (!user.clinicId) {
      throw new AppError('UNAUTHORIZED', 'No clinic context', 401);
    }
    return this.clinics.listMyBranches(user.clinicId);
  }

  @ApiBearerAuth()
  @RequirePermissions('settings:manage')
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
