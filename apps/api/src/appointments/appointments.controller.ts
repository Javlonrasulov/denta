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
import { Public, RequirePermissions } from '../common/guards/auth.guards';
import { AppointmentsService } from './appointments.service';
import {
  CancelAppointmentDto,
  CreateAppointmentDto,
  DoctorSlotsQueryDto,
  ListAppointmentsQueryDto,
  RescheduleAppointmentDto,
  UpdateAppointmentStatusDto,
} from './dto/appointments.dto';

@ApiTags('appointments')
@Controller()
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Public()
  @Get('doctors/:doctorId/slots')
  getSlots(
    @Param('doctorId') doctorId: string,
    @Query() query: DoctorSlotsQueryDto,
  ) {
    return this.appointments.getSlots({ ...query, doctorId });
  }

  @ApiBearerAuth()
  @RequirePermissions('appointment:create')
  @Get('appointments')
  list(
    @CurrentUser() user: AuthUser,
    @Query() query: ListAppointmentsQueryDto,
  ) {
    return this.appointments.list(query, user);
  }

  @ApiBearerAuth()
  @Get('appointments/:id')
  getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.appointments.getById(id, user);
  }

  @ApiBearerAuth()
  @RequirePermissions('appointment:create')
  @Post('appointments')
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateAppointmentDto,
  ) {
    return this.appointments.create(dto, user.id);
  }

  @ApiBearerAuth()
  @RequirePermissions('appointment:update')
  @Post('appointments/:id/cancel')
  cancel(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CancelAppointmentDto,
  ) {
    return this.appointments.cancel(id, user.id, dto);
  }

  @ApiBearerAuth()
  @RequirePermissions('appointment:update')
  @Patch('appointments/:id/cancel')
  cancelPatch(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CancelAppointmentDto,
  ) {
    return this.appointments.cancel(id, user.id, dto);
  }

  @ApiBearerAuth()
  @RequirePermissions('appointment:update')
  @Post('appointments/:id/reschedule')
  reschedule(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RescheduleAppointmentDto,
  ) {
    return this.appointments.reschedule(id, user.id, dto);
  }

  @ApiBearerAuth()
  @RequirePermissions('appointment:update')
  @Patch('appointments/:id/status')
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    return this.appointments.updateStatus(id, user, dto.status);
  }
}
