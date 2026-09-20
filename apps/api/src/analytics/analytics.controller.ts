import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/guards/auth.guards';
import { RequirePermissions } from '../common/guards/auth.guards';
import { PatientFlowQueryDto } from './dto/analytics.dto';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @ApiBearerAuth()
  @RequirePermissions('reports:read')
  @Get('dashboard')
  dashboard(@CurrentUser() user: AuthUser) {
    return this.analytics.getDashboard(
      this.analytics.assertClinic(user.clinicId),
    );
  }

  @ApiBearerAuth()
  @RequirePermissions('reports:read')
  @Get('patient-flow')
  patientFlow(
    @CurrentUser() user: AuthUser,
    @Query() query: PatientFlowQueryDto,
  ) {
    return this.analytics.getPatientFlow(
      this.analytics.assertClinic(user.clinicId),
      query.period ?? '7d',
    );
  }

  @ApiBearerAuth()
  @RequirePermissions('reports:read')
  @Get('revenue-series')
  revenueSeries(
    @CurrentUser() user: AuthUser,
    @Query() query: PatientFlowQueryDto,
  ) {
    return this.analytics.getRevenueSeries(
      this.analytics.assertClinic(user.clinicId),
      query.period ?? '7d',
    );
  }
}
