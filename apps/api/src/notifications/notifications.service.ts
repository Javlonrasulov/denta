import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { PushService } from './push.service';

export const NOTIFICATION_TYPES = [
  'APPOINTMENT_CREATED',
  'APPOINTMENT_CANCELLED',
  'APPOINTMENT_RESCHEDULED',
  'PAYMENT_RECEIVED',
  'LOW_INVENTORY',
  'TRIAL_EXPIRING',
  'SYSTEM',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly realtime?: RealtimeService,
    @Optional() private readonly push?: PushService,
  ) {}

  async list(userId: string, take = 50) {
    const rows = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
    });
    return rows.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      data: n.data,
      read: Boolean(n.readAt),
      createdAt: n.createdAt.toISOString(),
    }));
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, readAt: null },
    });
    return { count };
  }

  async markRead(userId: string, id: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }

  async create(input: {
    userId: string;
    type: NotificationType | string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }) {
    const row = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: (input.data as object) ?? undefined,
      },
    });
    this.realtime?.emitNotification(input.userId, {
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      createdAt: row.createdAt.toISOString(),
    });

    const data: Record<string, string> = {
      notificationId: row.id,
      type: String(input.type),
    };
    if (input.data) {
      for (const [k, v] of Object.entries(input.data)) {
        if (v == null) continue;
        data[k] = typeof v === 'string' ? v : JSON.stringify(v);
      }
    }
    void this.push
      ?.sendToUser(input.userId, {
        title: input.title,
        body: input.body,
        data,
      })
      .catch(() => undefined);

    return row;
  }

  async notifyClinicStaff(
    clinicId: string,
    input: {
      type: NotificationType | string;
      title: string;
      body: string;
      data?: Record<string, unknown>;
    },
  ) {
    const members = await this.prisma.clinicMember.findMany({
      where: { clinicId, isActive: true },
      select: { userId: true },
    });
    await Promise.all(
      members.map((m) =>
        this.create({
          userId: m.userId,
          type: input.type,
          title: input.title,
          body: input.body,
          data: input.data,
        }),
      ),
    );
  }
}
