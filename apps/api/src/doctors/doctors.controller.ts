import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AppError } from '../common/filters/global-exception.filter';
import type { AuthUser } from '../common/guards/auth.guards';
import {
  Public,
  RequirePermissions,
} from '../common/guards/auth.guards';
import { FinanceService } from '../finance/finance.service';
import { FinancePeriodQueryDto } from '../finance/dto/finance.dto';
import { MembersService } from '../members/members.service';
import { DoctorsService } from './doctors.service';
import {
  CreateClinicDoctorDto,
  ListDoctorsQueryDto,
  ReplaceDoctorScheduleDto,
  TopDoctorsQueryDto,
  UpdateDoctorProfileDto,
} from './dto/doctors.dto';

@ApiTags('doctors')
@Controller('doctors')
export class DoctorsController {
  constructor(
    private readonly doctors: DoctorsService,
    private readonly finance: FinanceService,
  ) {}

  @Public()
  @Get()
  list(@Query() query: ListDoctorsQueryDto) {
    return this.doctors.list(query);
  }

  @Public()
  @Get('top')
  top(@Query() query: TopDoctorsQueryDto) {
    return this.doctors.top(query);
  }

  @Public()
  @Get('available-today')
  availableToday(@Query() query: TopDoctorsQueryDto) {
    return this.doctors.availableToday(query);
  }

  @ApiBearerAuth()
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    this.doctors.assertDoctorRole(user);
    return this.doctors.getMyProfile(user.id, user.clinicId);
  }

  @ApiBearerAuth()
  @Patch('me')
  updateMe(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateDoctorProfileDto,
  ) {
    this.doctors.assertDoctorRole(user);
    return this.doctors.updateMyProfile(user.id, dto);
  }

  @ApiBearerAuth()
  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5_242_880 },
    }),
  )
  uploadAvatar(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    this.doctors.assertDoctorRole(user);
    if (!file) {
      throw new AppError('INVALID_FILE', 'file is required', 400);
    }
    return this.doctors.uploadAvatar(user.id, {
      buffer: file.buffer,
      mimetype: file.mimetype,
      size: file.size,
      originalname: file.originalname,
    });
  }

  @ApiBearerAuth()
  @Get('me/dashboard')
  dashboard(@CurrentUser() user: AuthUser) {
    this.doctors.assertDoctorRole(user);
    return this.doctors.getMyDashboard(user.id, user.clinicId);
  }

  @ApiBearerAuth()
  @Get('me/schedule')
  mySchedule(@CurrentUser() user: AuthUser) {
    this.doctors.assertDoctorRole(user);
    return this.doctors.getMySchedule(user.id, user.clinicId);
  }

  @ApiBearerAuth()
  @Put('me/schedule')
  replaceSchedule(
    @CurrentUser() user: AuthUser,
    @Body() dto: ReplaceDoctorScheduleDto,
  ) {
    this.doctors.assertDoctorRole(user);
    return this.doctors.replaceMySchedule(user.id, dto.schedule, user.clinicId);
  }

  @ApiBearerAuth()
  @Get('me/finance')
  myFinance(
    @CurrentUser() user: AuthUser,
    @Query() query: FinancePeriodQueryDto,
  ) {
    this.doctors.assertDoctorRole(user);
    return this.finance.listForDoctor(user.id, query.period ?? 'month', user.clinicId);
  }

  @Public()
  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.doctors.getById(id);
  }
}

@ApiTags('clinics')
@Controller('clinics/me')
export class ClinicDoctorsController {
  constructor(private readonly members: MembersService) {}

  @ApiBearerAuth()
  @RequirePermissions('doctor:manage')
  @Post('doctors')
  createDoctor(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateClinicDoctorDto,
  ) {
    if (!user.clinicId) {
      throw new AppError('UNAUTHORIZED', 'No clinic context', 401);
    }
    return this.members.createOrInvite(user.clinicId, user.id, {
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      email: dto.email,
      role: UserRole.DOCTOR,
      specialty: dto.specialty,
      serviceIds: dto.serviceIds,
    });
  }
}
