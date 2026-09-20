import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AppError } from '../common/filters/global-exception.filter';
import type { AuthUser } from '../common/guards/auth.guards';
import { RequirePermissions } from '../common/guards/auth.guards';
import { CreateRoomDto, PatchRoomDto } from './dto/rooms.dto';
import { RoomsService } from './rooms.service';

@ApiTags('rooms')
@Controller('rooms')
export class RoomsController {
  constructor(private readonly rooms: RoomsService) {}

  private clinicId(user: AuthUser): string {
    if (!user.clinicId) {
      throw new AppError('UNAUTHORIZED', 'No clinic context', 401);
    }
    return user.clinicId;
  }

  @ApiBearerAuth()
  @RequirePermissions('clinic:read')
  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.rooms.list(this.clinicId(user));
  }

  @ApiBearerAuth()
  @RequirePermissions('clinic:update')
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateRoomDto) {
    return this.rooms.create(this.clinicId(user), dto);
  }

  @ApiBearerAuth()
  @RequirePermissions('clinic:update')
  @Patch(':id')
  patch(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: PatchRoomDto,
  ) {
    return this.rooms.patch(this.clinicId(user), id, dto);
  }
}
