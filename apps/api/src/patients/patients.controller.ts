import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AppError } from '../common/filters/global-exception.filter';
import type { AuthUser } from '../common/guards/auth.guards';
import { RequirePermissions } from '../common/guards/auth.guards';
import {
  CreatePatientDto,
  ListPatientsQueryDto,
  PatchPatientNotesDto,
  UpdateOdontogramDto,
} from './dto/patients.dto';
import { PatientsService } from './patients.service';

@ApiTags('patients')
@Controller('patients')
export class PatientsController {
  constructor(private readonly patients: PatientsService) {}

  private clinicId(user: AuthUser): string {
    if (!user.clinicId) {
      throw new AppError('UNAUTHORIZED', 'No clinic context', 401);
    }
    return user.clinicId;
  }

  @ApiBearerAuth()
  @RequirePermissions('patient:read')
  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: ListPatientsQueryDto) {
    return this.patients.list(this.clinicId(user), query);
  }

  @ApiBearerAuth()
  @RequirePermissions('patient:read')
  @Get(':id')
  getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.patients.getById(this.clinicId(user), id);
  }

  @ApiBearerAuth()
  @RequirePermissions('patient:write')
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePatientDto) {
    return this.patients.create(this.clinicId(user), dto);
  }

  @ApiBearerAuth()
  @RequirePermissions('patient:write')
  @Patch(':id/notes')
  patchNotes(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: PatchPatientNotesDto,
  ) {
    return this.patients.patchNotes(this.clinicId(user), id, dto.notes);
  }

  @ApiBearerAuth()
  @RequirePermissions('patient:read')
  @Get(':id/odontogram')
  getOdontogram(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.patients.getOdontogram(this.clinicId(user), id);
  }

  @ApiBearerAuth()
  @RequirePermissions('patient:write')
  @Put(':id/odontogram')
  updateOdontogram(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateOdontogramDto,
  ) {
    return this.patients.updateOdontogram(this.clinicId(user), id, dto.teeth);
  }
}
