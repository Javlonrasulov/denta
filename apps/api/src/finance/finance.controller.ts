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
import { AppError } from '../common/filters/global-exception.filter';
import type { AuthUser } from '../common/guards/auth.guards';
import { RequirePermissions } from '../common/guards/auth.guards';
import {
  CreateFinanceRecordDto,
  FinancePeriodQueryDto,
  ListChargesQueryDto,
  PatchFinanceRecordDto,
  RecordChargePaymentDto,
} from './dto/finance.dto';
import { FinanceService } from './finance.service';

@ApiTags('finance')
@Controller('finance')
export class FinanceController {
  constructor(private readonly finance: FinanceService) {}

  private clinicId(user: AuthUser): string {
    if (!user.clinicId) {
      throw new AppError('UNAUTHORIZED', 'No clinic context', 401);
    }
    return user.clinicId;
  }

  @ApiBearerAuth()
  @RequirePermissions('finance:read')
  @Get('summary')
  summary(
    @CurrentUser() user: AuthUser,
    @Query() query: FinancePeriodQueryDto,
  ) {
    return this.finance.summary(
      this.clinicId(user),
      query.period ?? 'month',
    );
  }

  @ApiBearerAuth()
  @RequirePermissions('finance:read')
  @Get('charges')
  listCharges(
    @CurrentUser() user: AuthUser,
    @Query() query: ListChargesQueryDto,
  ) {
    return this.finance.listCharges(this.clinicId(user), {
      patientId: query.patientId,
      status: query.status,
    });
  }

  @ApiBearerAuth()
  @RequirePermissions('finance:read')
  @Get('charges/:id')
  getCharge(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.finance.getCharge(this.clinicId(user), id);
  }

  @ApiBearerAuth()
  @RequirePermissions('finance:write')
  @Post('charges/:id/payments')
  payCharge(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RecordChargePaymentDto,
  ) {
    return this.finance.recordChargePayment(this.clinicId(user), id, dto);
  }

  @ApiBearerAuth()
  @RequirePermissions('finance:read')
  @Get('patients/:patientId')
  patientFinance(
    @CurrentUser() user: AuthUser,
    @Param('patientId') patientId: string,
  ) {
    return this.finance.patientFinance(this.clinicId(user), patientId);
  }

  @ApiBearerAuth()
  @RequirePermissions('finance:read')
  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query() query: FinancePeriodQueryDto,
  ) {
    return this.finance.listForClinic(
      this.clinicId(user),
      query.period ?? 'month',
    );
  }

  @ApiBearerAuth()
  @RequirePermissions('finance:write')
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateFinanceRecordDto) {
    return this.finance.create(this.clinicId(user), dto);
  }

  @ApiBearerAuth()
  @RequirePermissions('finance:write')
  @Patch(':id')
  patch(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: PatchFinanceRecordDto,
  ) {
    return this.finance.patch(this.clinicId(user), id, dto);
  }
}
