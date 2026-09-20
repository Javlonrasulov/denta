import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AppError } from '../common/filters/global-exception.filter';
import type { AuthUser } from '../common/guards/auth.guards';
import { RequirePermissions } from '../common/guards/auth.guards';
import {
  CreateInventoryItemDto,
  InventoryMoveDto,
} from './dto/inventory.dto';
import { InventoryService } from './inventory.service';

@ApiTags('inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  private clinicId(user: AuthUser): string {
    if (!user.clinicId) {
      throw new AppError('UNAUTHORIZED', 'No clinic context', 401);
    }
    return user.clinicId;
  }

  @ApiBearerAuth()
  @RequirePermissions('inventory:manage')
  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.inventory.list(this.clinicId(user));
  }

  @ApiBearerAuth()
  @RequirePermissions('inventory:manage')
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateInventoryItemDto) {
    return this.inventory.create(this.clinicId(user), dto);
  }

  @ApiBearerAuth()
  @RequirePermissions('inventory:manage')
  @Get('low-stock')
  lowStock(@CurrentUser() user: AuthUser) {
    return this.inventory.lowStock(this.clinicId(user));
  }

  @ApiBearerAuth()
  @RequirePermissions('inventory:manage')
  @Post(':id/move')
  move(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: InventoryMoveDto,
  ) {
    return this.inventory.move(this.clinicId(user), id, dto, user.id);
  }
}
