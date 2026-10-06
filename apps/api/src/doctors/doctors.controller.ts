import {
  Body,
  Controller,
  Delete,
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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AppError } from '../common/filters/global-exception.filter';
import type { AuthUser } from '../common/guards/auth.guards';
import {
  Public,
  RequirePermissions,
} from '../common/guards/auth.guards';
import { PermissionsService } from '../common/permissions/permissions.service';
import {
  DOCTOR_FINANCE_PERMISSIONS,
  DoctorFinanceService,
} from '../doctor-finance/doctor-finance.service';
import { FinanceService } from '../finance/finance.service';
import { FinancePeriodQueryDto } from '../finance/dto/finance.dto';
import { MembersService } from '../members/members.service';
import { DoctorsService } from './doctors.service';
import { normalizeSchedule } from './schedule.util';
import {
  DoctorSpecialtiesService,
  joinSpecialties,
  normalizeSpecialtyName,
  splitSpecialties,
} from './specialties.service';
import {
  CreateClinicDoctorDto,
  DoctorSpecialtyNameDto,
  ListDoctorSpecialtiesQueryDto,
  ListDoctorsQueryDto,
  LookupClinicDoctorDto,
  RemoveClinicDoctorQueryDto,
  ReplaceDoctorScheduleDto,
  TopDoctorsQueryDto,
  UpdateClinicDoctorDto,
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
  constructor(
    private readonly members: MembersService,
    private readonly doctors: DoctorsService,
    private readonly specialties: DoctorSpecialtiesService,
    private readonly doctorFinance: DoctorFinanceService,
    private readonly permissions: PermissionsService,
  ) {}

  @ApiBearerAuth()
  @RequirePermissions('doctor:read')
  @Get('specialties')
  listSpecialties(
    @CurrentUser() user: AuthUser,
    @Query() query: ListDoctorSpecialtiesQueryDto,
  ) {
    return this.specialties.list(requireClinic(user), query.locale);
  }

  @ApiBearerAuth()
  @RequirePermissions('doctor:manage')
  @Post('specialties')
  createSpecialty(@CurrentUser() user: AuthUser, @Body() dto: DoctorSpecialtyNameDto) {
    return this.specialties.create(requireClinic(user), dto.name);
  }

  @ApiBearerAuth()
  @RequirePermissions('doctor:manage')
  @Patch('specialties/:id')
  renameSpecialty(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: DoctorSpecialtyNameDto,
  ) {
    return this.specialties.rename(requireClinic(user), id, dto.name);
  }

  @ApiBearerAuth()
  @RequirePermissions('doctor:manage')
  @Delete('specialties/:id')
  deleteSpecialty(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.specialties.remove(requireClinic(user), id);
  }

  @ApiBearerAuth()
  @RequirePermissions('doctor:read')
  @Get('doctors')
  listDoctors(@CurrentUser() user: AuthUser) {
    return this.doctors.listForClinic(requireClinic(user));
  }

  @ApiBearerAuth()
  @RequirePermissions('doctor:manage')
  @Post('doctors')
  async createDoctor(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateClinicDoctorDto,
  ) {
    const clinicId = requireClinic(user);
    const names = (dto.specialties?.length ? dto.specialties : splitSpecialties(dto.specialty)).map(
      normalizeSpecialtyName,
    );
    if (!names.length) {
      throw new AppError('VALIDATION_ERROR', 'At least one specialty is required', 400);
    }
    if (!dto.phone && !dto.existingUserId) {
      throw new AppError('INVALID_PHONE', 'phone or existingUserId is required', 400);
    }
    if (dto.agreement) {
      const allowed = await this.permissions.hasAll({
        roles: user.roles ?? [],
        membershipId: user.membershipId,
        required: [DOCTOR_FINANCE_PERMISSIONS.read, DOCTOR_FINANCE_PERMISSIONS.agreement],
      });
      if (!allowed) throw new AppError('FORBIDDEN', 'Not allowed to set financial agreements', 403);
      await this.doctorFinance.precheckAgreement(clinicId, dto.agreement);
    }
    const result = await this.members.createDoctorAccount(clinicId, user.id, {
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      phone: dto.phone,
      existingUserId: dto.existingUserId,
      email: dto.email,
      specialty: joinSpecialties(names),
      experienceYears: dto.experienceYears,
      serviceIds: dto.serviceIds,
      schedule: dto.schedule ? normalizeSchedule(dto.schedule) : undefined,
      slotDuration: dto.slotDuration,
    });
    await this.specialties.ensure(clinicId, names);
    const doctorId = await this.doctorFinance.doctorProfileIdOf(result.member.userId);
    if (!dto.agreement) return { ...result, doctorId };
    try {
      await this.doctorFinance.saveAgreementForUser(clinicId, user.id, result.member.userId, dto.agreement);
      return { ...result, doctorId, agreementSaved: true };
    } catch (e) {
      const err = e as { code?: string; message?: string };
      return {
        ...result,
        doctorId,
        agreementSaved: false,
        agreementError: { code: err.code ?? 'ERROR', message: err.message ?? '' },
      };
    }
  }

  @ApiBearerAuth()
  @RequirePermissions('doctor:manage')
  @Post('doctors/lookup')
  lookupDoctor(@CurrentUser() user: AuthUser, @Body() dto: LookupClinicDoctorDto) {
    return this.members.lookupDoctor(requireClinic(user), dto);
  }

  @ApiBearerAuth()
  @RequirePermissions('doctor:manage')
  @Delete('doctors/:id')
  removeDoctor(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query() query: RemoveClinicDoctorQueryDto,
  ) {
    return this.members.removeDoctorFromClinic(requireClinic(user), user.id, id, query.force === 'true');
  }

  @ApiBearerAuth()
  @RequirePermissions('doctor:manage')
  @Patch('doctors/:id')
  async updateDoctor(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateClinicDoctorDto,
  ) {
    const clinicId = requireClinic(user);
    const names = dto.specialties?.map(normalizeSpecialtyName);
    const result = await this.members.updateDoctorAccount(clinicId, user.id, id, {
      firstName: dto.firstName,
      lastName: dto.lastName,
      specialty: names?.length ? joinSpecialties(names) : undefined,
      experienceYears: dto.experienceYears,
      priceFrom: dto.priceFrom,
      schedule: dto.schedule ? normalizeSchedule(dto.schedule) : undefined,
      slotDuration: dto.slotDuration,
    });
    if (names?.length) await this.specialties.ensure(clinicId, names);
    return result;
  }

  @ApiBearerAuth()
  @RequirePermissions('doctor:manage')
  @Post('doctors/:id/reset-password')
  resetDoctorPassword(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.members.resetDoctorPassword(requireClinic(user), user.id, id);
  }
}

function requireClinic(user: AuthUser): string {
  if (!user.clinicId) {
    throw new AppError('UNAUTHORIZED', 'No clinic context', 401);
  }
  return user.clinicId;
}
