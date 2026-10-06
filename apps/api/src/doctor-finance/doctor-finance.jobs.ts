import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
  Optional,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.module';
import { addDays, fromUtcDate, toUtcDate, zonedHour, zonedYmd } from './engine/dates';
import { reminderKeyFor, type ReminderSettings } from './engine/ledger';
import { DoctorFinanceService } from './doctor-finance.service';
import { rentMessage } from './messages';

const LOCK_KEY = 'jobs:doctor-finance';
const DEFAULT_INTERVAL_MS = 15 * 60_000;

/**
 * Generation + reminder jobs. Pure service methods (`syncAll`, `runReminders`) so they
 * can move to a BullMQ repeatable job later without changes; today they run on an
 * in-process interval guarded by a Redis lock so only one API instance executes a tick.
 */
@Injectable()
export class DoctorFinanceJobs implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(DoctorFinanceJobs.name);
  private timer: NodeJS.Timeout | null = null;
  private starter: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly finance: DoctorFinanceService,
    private readonly redis: RedisService,
    @Optional() private readonly notifications?: NotificationsService,
  ) {}

  onApplicationBootstrap() {
    const disabled =
      process.env.DOCTOR_FINANCE_JOBS === 'off' || process.env.JEST_WORKER_ID !== undefined;
    if (disabled) {
      this.logger.log('Doctor finance jobs disabled');
      return;
    }
    const every = Number(process.env.DOCTOR_FINANCE_JOB_INTERVAL_MS) || DEFAULT_INTERVAL_MS;
    this.starter = setTimeout(() => void this.tick(), 20_000);
    this.timer = setInterval(() => void this.tick(), every);
    this.logger.log(`Doctor finance jobs every ${Math.round(every / 60_000)} min`);
  }

  onModuleDestroy() {
    if (this.starter) clearTimeout(this.starter);
    if (this.timer) clearInterval(this.timer);
  }

  async tick(now = new Date()) {
    if (this.running) return;
    this.running = true;
    const token = randomUUID();
    let locked = false;
    try {
      locked = await this.redis.acquireLock(LOCK_KEY, 10 * 60_000, token);
      if (!locked) return;
      const synced = await this.syncAll(now);
      const reminders = await this.runReminders(now);
      if (synced || reminders.sent) {
        this.logger.log(`tick: synced ${synced} links, sent ${reminders.sent} reminders`);
      }
    } catch (e) {
      this.logger.error(`tick failed: ${e instanceof Error ? e.stack : e}`);
    } finally {
      if (locked) await this.redis.releaseLock(LOCK_KEY, token).catch(() => undefined);
      this.running = false;
    }
  }

  /** Links with an active agreement, an open obligation, or an active agreement on an inactive link. */
  async syncAll(now = new Date()): Promise<number> {
    const links = await this.prisma.doctorClinic.findMany({
      where: {
        OR: [
          { financialAgreements: { some: { status: 'ACTIVE' } } },
          { rentObligations: { some: { cancelledAt: null, status: { not: 'PAID' } } } },
        ],
      },
      select: { id: true },
    });
    for (const l of links) {
      await this.finance
        .syncLink(l.id, now)
        .catch((e: unknown) => this.logger.warn(`sync ${l.id} failed: ${e instanceof Error ? e.message : e}`));
    }
    return links.length;
  }

  async runReminders(now = new Date()): Promise<{ sent: number; skipped: number }> {
    const stats = { sent: 0, skipped: 0 };
    const clinics = await this.prisma.doctorRentObligation.groupBy({
      by: ['clinicId'],
      where: { cancelledAt: null, status: { notIn: ['PAID', 'CANCELLED'] } },
    });
    for (const { clinicId } of clinics) {
      try {
        await this.remindClinic(clinicId, now, stats);
      } catch (e) {
        this.logger.warn(`reminders for ${clinicId} failed: ${e instanceof Error ? e.message : e}`);
      }
    }
    return stats;
  }

  private async remindClinic(clinicId: string, now: Date, stats: { sent: number; skipped: number }) {
    const clinic = await this.prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { name: true, timezone: true },
    });
    if (!clinic) return;
    const tz = clinic.timezone || 'Asia/Tashkent';
    const settings = await this.finance.getReminderSettings(clinicId);
    if (zonedHour(now, tz) < settings.sendHour) return;
    const today = zonedYmd(now, tz);
    const obligations = await this.prisma.doctorRentObligation.findMany({
      where: {
        clinicId,
        cancelledAt: null,
        status: { notIn: ['PAID', 'CANCELLED'] },
        dueDate: { lte: toUtcDate(addDays(today, 3)) },
      },
      include: {
        agreement: { select: { graceDays: true } },
        doctorClinic: {
          select: {
            isActive: true,
            doctorId: true,
            doctor: { select: { userId: true, user: { select: { firstName: true, lastName: true, locale: true } } } },
          },
        },
      },
    });
    if (!obligations.length) return;
    let staff: { userId: string; locale: string }[] | null = null;

    for (const o of obligations) {
      const outstanding = o.amountUzs - o.paidUzs;
      const due = fromUtcDate(o.dueDate);
      const r = reminderKeyFor(
        { dueDate: due, outstanding, cancelled: false },
        today,
        settings as ReminderSettings,
        o.agreement?.graceDays ?? 0,
      );
      if (!r) continue;
      const doctorUser = o.doctorClinic.doctor;
      const doctorName = `${doctorUser.user.firstName} ${doctorUser.user.lastName}`.trim();
      const recipients: { userId: string; locale: string; audience: 'doctor' | 'staff' }[] = [];
      if (settings.notifyDoctor && o.doctorClinic.isActive) {
        recipients.push({ userId: doctorUser.userId, locale: doctorUser.user.locale, audience: 'doctor' });
      }
      if (settings.notifyStaff && (r.kind === 'DUE' || r.kind === 'OVERDUE')) {
        staff ??= await this.finance.staffRecipients(clinicId);
        for (const s of staff) recipients.push({ ...s, audience: 'staff' });
      }
      for (const rcp of recipients) {
        const fresh = await this.claim(clinicId, o.id, rcp.userId, `${rcp.audience}:${r.key}`);
        if (!fresh) {
          stats.skipped += 1;
          continue;
        }
        const msg = rentMessage(rcp.audience, r.kind, rcp.locale, {
          amount: outstanding,
          date: due,
          clinicName: clinic.name,
          doctorName,
          daysOverdue: r.daysOverdue,
        });
        await this.notifications
          ?.create({
            userId: rcp.userId,
            type: 'DOCTOR_RENT_REMINDER',
            ...msg,
            data: {
              clinicId,
              doctorId: o.doctorClinic.doctorId,
              obligationId: o.id,
              kind: r.kind,
              amountUzs: outstanding,
              dueDate: due,
              clinicName: clinic.name,
              doctorName,
              daysOverdue: r.daysOverdue,
            },
          })
          .catch((e: unknown) => this.logger.warn(`notify failed: ${e instanceof Error ? e.message : e}`));
        stats.sent += 1;
      }
    }
  }

  /** Inserts the dedupe row; false when this reminder was already sent to the recipient. */
  private async claim(clinicId: string, obligationId: string, userId: string, reminderKey: string) {
    try {
      await this.prisma.doctorRentReminderLog.create({ data: { clinicId, obligationId, userId, reminderKey } });
      return true;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return false;
      throw e;
    }
  }
}
