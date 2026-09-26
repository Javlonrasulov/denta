import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SubscriptionStatus, ClinicAccountStatus } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AppError } from '../common/filters/global-exception.filter';
import type { AuthUser } from '../common/guards/auth.guards';
import { RequirePermissions } from '../common/guards/auth.guards';
import { AuditService } from '../common/audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private assertSuper(user: AuthUser) {
    if (!user.roles.includes('DENTA_SUPER_ADMIN')) {
      throw new AppError('FORBIDDEN', 'Super admin required', 403);
    }
  }

  @Get('clinics')
  @RequirePermissions('clinic:read')
  async listClinics(@CurrentUser() user: AuthUser) {
    this.assertSuper(user);
    const rows = await this.prisma.clinic.findMany({
      include: { subscription: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return rows.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      accountStatus: c.accountStatus,
      bookingEnabled: c.bookingEnabled,
      subscriptionStatus: c.subscription?.status ?? null,
      trialEndsAt: c.subscription?.trialEndsAt?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
    }));
  }

  @Post('clinics/:id/block')
  async block(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    this.assertSuper(user);
    const clinic = await this.prisma.clinic.update({
      where: { id },
      data: {
        accountStatus: ClinicAccountStatus.BLOCKED,
        bookingEnabled: false,
        isMarketplaceVisible: false,
      },
    });
    await this.audit.log({
      userId: user.id,
      clinicId: id,
      action: 'admin.clinic_blocked',
      entity: 'Clinic',
      entityId: id,
    });
    return { id: clinic.id, accountStatus: clinic.accountStatus };
  }

  @Post('clinics/:id/unblock')
  async unblock(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    this.assertSuper(user);
    const clinic = await this.prisma.clinic.update({
      where: { id },
      data: { accountStatus: ClinicAccountStatus.ACTIVE },
    });
    await this.audit.log({
      userId: user.id,
      clinicId: id,
      action: 'admin.clinic_unblocked',
      entity: 'Clinic',
      entityId: id,
    });
    return { id: clinic.id, accountStatus: clinic.accountStatus };
  }

  @Post('clinics/:id/subscription/activate')
  async activateSubscription(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { days?: number; note?: string },
  ) {
    this.assertSuper(user);
    const days = body.days && body.days > 0 ? body.days : 30;
    const now = new Date();
    const ends = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const existing = await this.prisma.subscription.findUnique({ where: { clinicId: id } });
    const fromStatus = existing?.status ?? null;
    const sub = await this.prisma.subscription.upsert({
      where: { clinicId: id },
      create: {
        clinicId: id,
        status: SubscriptionStatus.ACTIVE,
        subscriptionStartedAt: now,
        subscriptionEndsAt: ends,
        marketplaceBookingEnabled: true,
      },
      update: {
        status: SubscriptionStatus.ACTIVE,
        subscriptionStartedAt: now,
        subscriptionEndsAt: ends,
        marketplaceBookingEnabled: true,
      },
    });
    await this.prisma.subscriptionHistory.create({
      data: {
        clinicId: id,
        fromStatus,
        toStatus: SubscriptionStatus.ACTIVE,
        note: body.note ?? `Manual activate ${days}d`,
      },
    });
    await this.audit.log({
      userId: user.id,
      clinicId: id,
      action: 'admin.subscription_activated',
      entity: 'Subscription',
      entityId: sub.id,
      after: { days, endsAt: ends.toISOString() },
    });
    return {
      clinicId: id,
      status: sub.status,
      subscriptionEndsAt: sub.subscriptionEndsAt?.toISOString() ?? null,
    };
  }
}
