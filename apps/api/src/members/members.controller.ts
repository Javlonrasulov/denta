import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AppError } from '../common/filters/global-exception.filter';
import type { AuthUser } from '../common/guards/auth.guards';
import { Public, RequirePermissions } from '../common/guards/auth.guards';
import {
  AcceptInvitationDto,
  CreateMemberDto,
  LookupMemberDto,
  UpdateMemberDto,
  UpdateMemberPermissionsDto,
} from './dto/members.dto';
import { MembersService } from './members.service';

@ApiTags('members')
@ApiBearerAuth()
@Controller('clinics/me')
export class MembersController {
  constructor(private readonly members: MembersService) {}

  private clinicId(user: AuthUser): string {
    if (!user.clinicId) {
      throw new AppError('UNAUTHORIZED', 'No clinic context', 401);
    }
    return user.clinicId;
  }

  @RequirePermissions('members:manage')
  @Get('members')
  list(@CurrentUser() user: AuthUser) {
    return this.members.list(this.clinicId(user));
  }

  @RequirePermissions('members:manage')
  @Get('invitations')
  listInvitations(@CurrentUser() user: AuthUser) {
    return this.members.listInvitations(this.clinicId(user));
  }

  @RequirePermissions('members:manage')
  @Post('members/lookup')
  lookup(@CurrentUser() user: AuthUser, @Body() dto: LookupMemberDto) {
    return this.members.lookupExisting(this.clinicId(user), dto);
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @RequirePermissions('members:manage')
  @Post('members')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateMemberDto) {
    return this.members.createOrInvite(this.clinicId(user), user.id, dto);
  }

  @RequirePermissions('members:manage')
  @Get('members/:id')
  getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.members.getOne(this.clinicId(user), id);
  }

  @RequirePermissions('members:manage')
  @Patch('members/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.members.update(this.clinicId(user), user.id, id, dto);
  }

  @RequirePermissions('members:manage')
  @Patch('members/:id/permissions')
  updatePermissions(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateMemberPermissionsDto,
  ) {
    return this.members.updatePermissions(this.clinicId(user), user.id, id, dto);
  }

  @RequirePermissions('members:manage')
  @Post('members/:id/deactivate')
  deactivate(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.members.deactivate(this.clinicId(user), user.id, id);
  }

  @RequirePermissions('members:manage')
  @Post('members/:id/reactivate')
  reactivate(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.members.reactivate(this.clinicId(user), user.id, id);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @RequirePermissions('members:manage')
  @Post('invitations')
  invite(@CurrentUser() user: AuthUser, @Body() dto: CreateMemberDto) {
    return this.members.createOrInvite(this.clinicId(user), user.id, dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @RequirePermissions('members:manage')
  @Post('invitations/:id/resend')
  resend(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.members.resendInvitation(this.clinicId(user), user.id, id);
  }
}

@ApiTags('invitations')
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly members: MembersService) {}

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Get(':token')
  peek(@Param('token') token: string) {
    return this.members.peekInvitation(token);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post(':token/accept')
  accept(@Param('token') token: string, @Body() dto: AcceptInvitationDto) {
    return this.members.acceptInvitation(token, dto);
  }
}
