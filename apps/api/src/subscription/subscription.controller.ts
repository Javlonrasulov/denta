import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/guards/auth.guards';
import { AuthService } from '../auth/auth.service';

@ApiTags('subscription')
@ApiBearerAuth()
@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly auth: AuthService) {}

  @Get('status')
  status(@CurrentUser() user: AuthUser) {
    return this.auth.getSubscriptionStatus(user.id, user.clinicId);
  }
}
