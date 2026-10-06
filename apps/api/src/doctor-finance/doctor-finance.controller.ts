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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AppError } from '../common/filters/global-exception.filter';
import type { AuthUser } from '../common/guards/auth.guards';
import { RequirePermissions } from '../common/guards/auth.guards';
import { DOCTOR_FINANCE_PERMISSIONS as P, DoctorFinanceService } from './doctor-finance.service';
import {
  OpeningBalanceDto,
  OverviewQueryDto,
  PatchRentPaymentDto,
  ReasonDto,
  RecordRentPaymentDto,
  ReminderSettingsDto,
  ReportQueryDto,
  SaveAgreementDto,
} from './dto/doctor-finance.dto';

/** The clinic always comes from the authenticated workspace, never from the request. */
function clinicOf(user: AuthUser): string {
  if (!user.clinicId) throw new AppError('UNAUTHORIZED', 'No clinic context', 401);
  return user.clinicId;
}

@ApiTags('doctor-finance')
@ApiBearerAuth()
@Controller('clinics/me/doctor-finance')
export class DoctorFinanceController {
  constructor(private readonly finance: DoctorFinanceService) {}

  @RequirePermissions(P.read)
  @Get('overview')
  overview(@CurrentUser() user: AuthUser, @Query() query: OverviewQueryDto) {
    return this.finance.overview(clinicOf(user), query);
  }

  @RequirePermissions(P.read)
  @Get('report')
  report(@CurrentUser() user: AuthUser, @Query() query: ReportQueryDto) {
    return this.finance.report(clinicOf(user), query);
  }

  @RequirePermissions(P.read)
  @Get('reminder-settings')
  reminderSettings(@CurrentUser() user: AuthUser) {
    return this.finance.getReminderSettings(clinicOf(user));
  }

  @RequirePermissions(P.manage)
  @Put('reminder-settings')
  updateReminderSettings(@CurrentUser() user: AuthUser, @Body() dto: ReminderSettingsDto) {
    return this.finance.updateReminderSettings(clinicOf(user), user.id, dto);
  }

  @RequirePermissions(P.read)
  @Get('doctors/:doctorId')
  detail(@CurrentUser() user: AuthUser, @Param('doctorId') doctorId: string) {
    return this.finance.detail(clinicOf(user), doctorId);
  }

  @RequirePermissions(P.read, P.agreement)
  @Post('doctors/:doctorId/agreements')
  saveAgreement(
    @CurrentUser() user: AuthUser,
    @Param('doctorId') doctorId: string,
    @Body() dto: SaveAgreementDto,
  ) {
    return this.finance.saveAgreement(clinicOf(user), user.id, doctorId, dto);
  }

  @RequirePermissions(P.read, P.manage)
  @Post('doctors/:doctorId/opening-balance')
  openingBalance(
    @CurrentUser() user: AuthUser,
    @Param('doctorId') doctorId: string,
    @Body() dto: OpeningBalanceDto,
  ) {
    return this.finance.addOpeningBalance(clinicOf(user), user.id, doctorId, dto);
  }

  @RequirePermissions(P.read, P.manage)
  @Post('doctors/:doctorId/obligations/:obligationId/cancel')
  cancelObligation(
    @CurrentUser() user: AuthUser,
    @Param('doctorId') doctorId: string,
    @Param('obligationId') obligationId: string,
    @Body() dto: ReasonDto,
  ) {
    return this.finance.cancelObligation(clinicOf(user), user.id, doctorId, obligationId, dto.reason);
  }

  @RequirePermissions(P.read, P.payment)
  @Post('receipts')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 5_242_880 } }))
  uploadReceipt(@CurrentUser() user: AuthUser, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new AppError('INVALID_FILE', 'file is required', 400);
    return this.finance.uploadReceipt(clinicOf(user), file);
  }

  @RequirePermissions(P.read, P.payment)
  @Post('doctors/:doctorId/payments')
  recordPayment(
    @CurrentUser() user: AuthUser,
    @Param('doctorId') doctorId: string,
    @Body() dto: RecordRentPaymentDto,
  ) {
    return this.finance.recordPayment(clinicOf(user), user.id, doctorId, dto);
  }

  @RequirePermissions(P.read, P.payment)
  @Patch('doctors/:doctorId/payments/:paymentId')
  patchPayment(
    @CurrentUser() user: AuthUser,
    @Param('doctorId') doctorId: string,
    @Param('paymentId') paymentId: string,
    @Body() dto: PatchRentPaymentDto,
  ) {
    return this.finance.patchPayment(clinicOf(user), user.id, doctorId, paymentId, dto);
  }

  @RequirePermissions(P.read, P.manage)
  @Post('doctors/:doctorId/payments/:paymentId/void')
  voidPayment(
    @CurrentUser() user: AuthUser,
    @Param('doctorId') doctorId: string,
    @Param('paymentId') paymentId: string,
    @Body() dto: ReasonDto,
  ) {
    return this.finance.voidPayment(clinicOf(user), user.id, doctorId, paymentId, dto.reason);
  }

  @RequirePermissions(P.read, P.payment)
  @Post('doctors/:doctorId/payments/:paymentId/confirm')
  confirmPayment(
    @CurrentUser() user: AuthUser,
    @Param('doctorId') doctorId: string,
    @Param('paymentId') paymentId: string,
  ) {
    return this.finance.reviewSubmission(clinicOf(user), user.id, doctorId, paymentId, 'confirm');
  }

  @RequirePermissions(P.read, P.payment)
  @Post('doctors/:doctorId/payments/:paymentId/reject')
  rejectPayment(
    @CurrentUser() user: AuthUser,
    @Param('doctorId') doctorId: string,
    @Param('paymentId') paymentId: string,
    @Body() dto: ReasonDto,
  ) {
    return this.finance.reviewSubmission(clinicOf(user), user.id, doctorId, paymentId, 'reject', dto.reason);
  }
}

/** Doctor app: read-only view of the doctor's own settlement with the active clinic. */
@ApiTags('doctor-finance')
@ApiBearerAuth()
@Controller('doctors/me/clinic-finance')
export class MyClinicFinanceController {
  constructor(private readonly finance: DoctorFinanceService) {}

  @Get()
  mine(@CurrentUser() user: AuthUser) {
    assertDoctor(user);
    return this.finance.myFinance(user.id, user.clinicId);
  }

  @Post('payments')
  submit(@CurrentUser() user: AuthUser, @Body() dto: RecordRentPaymentDto) {
    assertDoctor(user);
    return this.finance.submitMyPayment(user.id, user.clinicId, dto);
  }
}

function assertDoctor(user: AuthUser) {
  if (!user.roles?.includes('DOCTOR')) throw new AppError('FORBIDDEN', 'Doctor role required', 403);
}
