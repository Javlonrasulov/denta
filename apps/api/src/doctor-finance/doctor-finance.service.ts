import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import {
  DoctorRentPaymentStatus,
  PaymentMethod,
  Prisma,
  RentObligationStatus,
  UserRole,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { fromZonedTime } from 'date-fns-tz';
import { AuditService } from '../common/audit/audit.service';
import { AppError } from '../common/filters/global-exception.filter';
import { PermissionsService } from '../common/permissions/permissions.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { STORAGE_SERVICE, type StorageService } from '../storage/storage.types';
import {
  MAX_BACKDATE_DAYS,
  normalizeAgreement,
  ruleFromAgreement,
} from './agreement.normalize';
import {
  addDays,
  diffDays,
  endOfMonth,
  fromUtcDate,
  startOfMonth,
  toUtcDate,
  zonedYmd,
  type Ymd,
} from './engine/dates';
import {
  agingBuckets,
  obligationStatus,
  planAllocations,
  type ObligationStatus,
} from './engine/ledger';
import { nextDueAfter, planObligations, type RentRule } from './engine/rent-schedule';
import {
  OpeningBalanceDto,
  OverviewQueryDto,
  PatchRentPaymentDto,
  RecordRentPaymentDto,
  ReminderSettingsDto,
  ReportQueryDto,
  SaveAgreementDto,
} from './dto/doctor-finance.dto';
import { rentMessage } from './messages';
import { RevenueShareService } from './revenue-share.service';

type Tx = Prisma.TransactionClient;

export const DOCTOR_FINANCE_PERMISSIONS = {
  read: 'doctor_finance:read',
  payment: 'doctor_finance:payment',
  manage: 'doctor_finance:manage',
  agreement: 'doctor_finance:agreement',
} as const;

const STAFF_ROLES: UserRole[] = [UserRole.CLINIC_OWNER, UserRole.CLINIC_ADMIN, UserRole.ACCOUNTANT];
const DEFAULT_TZ = 'Asia/Tashkent';
const LOOKAHEAD_DAYS = 35;
/** Exactly the names produced by uploadReceipt. */
const RECEIPT_FILE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|pdf)$/;

const METHOD_IN: Record<string, PaymentMethod> = {
  cash: PaymentMethod.CASH,
  card: PaymentMethod.CARD,
  transfer: PaymentMethod.TRANSFER,
  other: PaymentMethod.OTHER,
};
const METHOD_OUT: Record<PaymentMethod, string> = {
  CASH: 'cash',
  CARD: 'card',
  TRANSFER: 'transfer',
  OTHER: 'other',
};

export type RowStatus = 'paid' | 'pending' | 'debtor' | 'overdue' | 'not_configured';

type LinkCtx = {
  id: string;
  clinicId: string;
  doctorId: string;
  isActive: boolean;
  startedAt: Date;
  endedAt: Date | null;
  doctorUserId: string;
  doctorName: string;
  photoUrl: string | null;
  timezone: string;
  clinicName: string;
};

function horizonFor(rule: RentRule, today: Ymd): Ymd {
  switch (rule.recurrence) {
    case 'DAILY':
      return today;
    case 'WEEKLY':
      return addDays(today, 7);
    case 'ONE_TIME':
      return addDays(today, 3 * 366);
    case 'INTERVAL': {
      const n = rule.intervalValue ?? 1;
      const len = rule.intervalUnit === 'DAY' ? n : rule.intervalUnit === 'WEEK' ? n * 7 : n * 31;
      return addDays(today, Math.min(LOOKAHEAD_DAYS, len));
    }
    default:
      return addDays(today, LOOKAHEAD_DAYS);
  }
}

@Injectable()
export class DoctorFinanceService {
  private readonly logger = new Logger(DoctorFinanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly permissions: PermissionsService,
    private readonly share: RevenueShareService,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
    @Optional() private readonly notifications?: NotificationsService,
  ) {}

  // ─── Context ────────────────────────────────────────────────────────────────

  /** DoctorClinic of `doctorId` inside the caller's clinic only (tenant isolation). */
  private async resolveLink(clinicId: string, doctorId: string): Promise<LinkCtx> {
    const link = await this.prisma.doctorClinic.findFirst({
      where: { clinicId, doctorId },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
      include: {
        clinic: { select: { timezone: true, name: true } },
        doctor: {
          select: {
            userId: true,
            avatarUrl: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
    if (!link) throw new AppError('NOT_FOUND', 'Doctor not found in this clinic', 404);
    return {
      id: link.id,
      clinicId: link.clinicId,
      doctorId: link.doctorId,
      isActive: link.isActive,
      startedAt: link.startedAt,
      endedAt: link.endedAt,
      doctorUserId: link.doctor.userId,
      doctorName: `${link.doctor.user.firstName} ${link.doctor.user.lastName}`.trim(),
      photoUrl: link.doctor.avatarUrl,
      timezone: link.clinic.timezone || DEFAULT_TZ,
      clinicName: link.clinic.name,
    };
  }

  private async clinicInfo(clinicId: string) {
    const c = await this.prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { timezone: true, name: true },
    });
    if (!c) throw new AppError('NOT_FOUND', 'Clinic not found', 404);
    return { timezone: c.timezone || DEFAULT_TZ, name: c.name };
  }

  private lock(tx: Tx, key: string) {
    return tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`dfin:${key}`}))`;
  }

  // ─── Sync: generate → allocate → statuses ─────────────────────────────────

  /** Idempotent. Safe to call from the job, after mutations and before reads. */
  async syncLink(doctorClinicId: string, now = new Date()): Promise<void> {
    await this.prisma.$transaction(
      async (tx) => {
        await this.lock(tx, doctorClinicId);
        const link = await tx.doctorClinic.findUnique({
          where: { id: doctorClinicId },
          include: {
            clinic: { select: { timezone: true } },
            schedules: { where: { isActive: true }, select: { dayOfWeek: true } },
          },
        });
        if (!link) return;
        const tz = link.clinic.timezone || DEFAULT_TZ;
        const today = zonedYmd(now, tz);
        if (!link.isActive) await this.endForInactiveLink(tx, link, tz);
        await this.generate(tx, link, today);
        await this.allocate(tx, link.id);
        await this.refreshStatuses(tx, link.id, today);
      },
      { timeout: 60_000 },
    );
  }

  private async endForInactiveLink(
    tx: Tx,
    link: { id: string; clinicId: string; endedAt: Date | null },
    tz: string,
  ) {
    const active = await tx.doctorFinancialAgreement.findMany({
      where: { doctorClinicId: link.id, status: 'ACTIVE' },
    });
    if (!active.length) return;
    const endDay = zonedYmd(link.endedAt ?? new Date(), tz);
    for (const ag of active) {
      const from = fromUtcDate(ag.effectiveFrom);
      const to = endDay < from ? addDays(from, -1) : endDay;
      await tx.doctorFinancialAgreement.update({
        where: { id: ag.id },
        data: { status: 'ENDED', effectiveTo: toUtcDate(to), supersededAt: new Date() },
      });
      const future = await tx.doctorRentObligation.findMany({
        where: {
          agreementId: ag.id,
          kind: 'RENT',
          cancelledAt: null,
          periodStart: { gt: toUtcDate(to) },
        },
        select: { id: true },
      });
      for (const o of future) await this.cancelObligationTx(tx, o.id, null, 'doctor_left_clinic');
      await this.audit.log({
        clinicId: link.clinicId,
        action: 'doctor_finance.agreement.ended',
        entity: 'DoctorFinancialAgreement',
        entityId: ag.id,
        before: { status: ag.status, effectiveTo: ag.effectiveTo },
        after: { status: 'ENDED', effectiveTo: to, cancelledFutureObligations: future.length },
      });
    }
  }

  private async generate(
    tx: Tx,
    link: { id: string; clinicId: string; doctorId: string; schedules: { dayOfWeek: number }[] },
    today: Ymd,
  ) {
    const agreements = await tx.doctorFinancialAgreement.findMany({
      where: { doctorClinicId: link.id, rentEnabled: true },
      include: { scheduleItems: true },
      orderBy: { version: 'asc' },
    });
    if (!agreements.length) return;
    const needsDaysOff = agreements.some((a) => a.dailyBasis === 'WORKING_DAYS');
    const daysOff = needsDaysOff
      ? (
          await tx.doctorScheduleException.findMany({
            where: {
              doctorId: link.doctorId,
              type: { in: ['VACATION', 'DAY_OFF'] },
              date: { gte: toUtcDate(addDays(today, -MAX_BACKDATE_DAYS - 1)), lte: toUtcDate(today) },
            },
            select: { date: true },
          })
        ).map((e) => fromUtcDate(e.date))
      : [];
    const workingDays = link.schedules.map((s) => s.dayOfWeek);

    for (const [idx, ag] of agreements.entries()) {
      const rule = ruleFromAgreement(ag);
      if (!rule) continue;
      if (rule.effectiveTo && rule.effectiveTo < rule.effectiveFrom) continue;
      const earlierIds = agreements.slice(0, idx).map((a) => a.id);
      let coveredUntil: Ymd | null = null;
      if (earlierIds.length) {
        const last = await tx.doctorRentObligation.findFirst({
          where: { agreementId: { in: earlierIds }, kind: 'RENT', cancelledAt: null },
          orderBy: { periodEnd: 'desc' },
          select: { periodEnd: true },
        });
        coveredUntil = last ? fromUtcDate(last.periodEnd) : null;
      }
      const plan = planObligations(rule, {
        until: horizonFor(rule, today),
        coveredUntil,
        workingDays,
        daysOff,
      });
      if (!plan.length) continue;
      await tx.doctorRentObligation.createMany({
        data: plan.map((p) => ({
          clinicId: link.clinicId,
          doctorClinicId: link.id,
          agreementId: ag.id,
          kind: 'RENT' as const,
          periodKey: p.periodKey,
          periodStart: toUtcDate(p.periodStart),
          periodEnd: toUtcDate(p.periodEnd),
          dueDate: toUtcDate(p.dueDate),
          amountUzs: p.amountUzs,
          note: p.prorated ? 'prorated' : null,
        })),
        skipDuplicates: true,
      });
    }
  }

  private async allocate(tx: Tx, doctorClinicId: string) {
    const payments = await tx.doctorRentPayment.findMany({
      where: { doctorClinicId, kind: 'PAYMENT', status: 'CONFIRMED' },
      orderBy: [{ paidAt: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        amountUzs: true,
        allocations: { where: { reversedAt: null }, select: { amountUzs: true } },
      },
    });
    const credits = payments
      .map((p) => ({
        paymentId: p.id,
        available: p.amountUzs - p.allocations.reduce((s, a) => s + a.amountUzs, 0),
      }))
      .filter((c) => c.available > 0);
    if (!credits.length) return;
    const open = await tx.doctorRentObligation.findMany({
      where: { doctorClinicId, cancelledAt: null },
      select: { id: true, amountUzs: true, paidUzs: true, dueDate: true, createdAt: true },
    });
    const plan = planAllocations(
      credits,
      open.map((o) => ({
        id: o.id,
        outstanding: o.amountUzs - o.paidUzs,
        dueDate: fromUtcDate(o.dueDate),
        createdAt: o.createdAt.getTime(),
      })),
    );
    if (!plan.length) return;
    await tx.doctorRentAllocation.createMany({ data: plan });
    const byObligation = new Map<string, number>();
    for (const p of plan) byObligation.set(p.obligationId, (byObligation.get(p.obligationId) ?? 0) + p.amountUzs);
    for (const [id, amount] of byObligation) {
      await tx.doctorRentObligation.update({ where: { id }, data: { paidUzs: { increment: amount } } });
    }
  }

  private async refreshStatuses(tx: Tx, doctorClinicId: string, today: Ymd) {
    const rows = await tx.doctorRentObligation.findMany({
      where: { doctorClinicId, cancelledAt: null },
      select: {
        id: true,
        amountUzs: true,
        paidUzs: true,
        dueDate: true,
        status: true,
        agreement: { select: { graceDays: true } },
      },
    });
    const changes = new Map<RentObligationStatus, string[]>();
    for (const r of rows) {
      const s = obligationStatus(
        { amountUzs: r.amountUzs, paidUzs: r.paidUzs, dueDate: fromUtcDate(r.dueDate), cancelled: false },
        today,
        r.agreement?.graceDays ?? 0,
      ) as RentObligationStatus;
      if (s !== r.status) changes.set(s, [...(changes.get(s) ?? []), r.id]);
    }
    for (const [status, ids] of changes) {
      await tx.doctorRentObligation.updateMany({ where: { id: { in: ids } }, data: { status } });
    }
  }

  private async cancelObligationTx(tx: Tx, obligationId: string, actorUserId: string | null, reason: string) {
    await tx.doctorRentAllocation.updateMany({
      where: { obligationId, reversedAt: null },
      data: { reversedAt: new Date() },
    });
    await tx.doctorRentObligation.update({
      where: { id: obligationId },
      data: {
        paidUzs: 0,
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledByUserId: actorUserId,
        cancelReason: reason,
      },
    });
  }

  // ─── Agreements ─────────────────────────────────────────────────────────────

  /** Validates an agreement before anything else is written (used by the add-doctor flow). */
  async precheckAgreement(clinicId: string, dto: SaveAgreementDto, now = new Date()) {
    const clinic = await this.clinicInfo(clinicId);
    await this.validateAgreementInput(dto, zonedYmd(now, clinic.timezone));
  }

  /** Everything that can be checked without the doctor link; shared by precheck and save. */
  private async validateAgreementInput(dto: SaveAgreementDto, today: Ymd) {
    const norm = normalizeAgreement(dto, today);
    if (norm.serviceRules.length) {
      const found = await this.prisma.service.count({
        where: { id: { in: norm.serviceRules.map((r) => r.serviceId) } },
      });
      if (found !== norm.serviceRules.length) {
        throw new AppError('VALIDATION_ERROR', 'Unknown service in overrides', 400, { field: 'serviceRules' });
      }
    }
    if (dto.openingBalance?.asOf && dto.openingBalance.asOf > today) {
      throw new AppError('VALIDATION_ERROR', 'Opening balance date is in the future', 400, {
        field: 'openingBalance.asOf',
      });
    }
    if (dto.priorPayment && dto.priorPayment.paidAt > today) {
      throw new AppError('VALIDATION_ERROR', 'Payment date is in the future', 400, { field: 'priorPayment.paidAt' });
    }
    return norm;
  }

  async doctorProfileIdOf(userId: string): Promise<string | null> {
    const doctor = await this.prisma.doctorProfile.findUnique({ where: { userId }, select: { id: true } });
    return doctor?.id ?? null;
  }

  async saveAgreementForUser(clinicId: string, actorUserId: string, doctorUserId: string, dto: SaveAgreementDto) {
    const doctorId = await this.doctorProfileIdOf(doctorUserId);
    if (!doctorId) throw new AppError('NOT_FOUND', 'Doctor profile not found', 404);
    return this.saveAgreement(clinicId, actorUserId, doctorId, dto);
  }

  async saveAgreement(
    clinicId: string,
    actorUserId: string,
    doctorId: string,
    dto: SaveAgreementDto,
    now = new Date(),
  ) {
    const link = await this.resolveLink(clinicId, doctorId);
    if (!link.isActive) {
      throw new AppError('DOCTOR_INACTIVE', 'Doctor no longer works in this clinic', 409);
    }
    const today = zonedYmd(now, link.timezone);
    const norm = await this.validateAgreementInput(dto, today);

    const result = await this.prisma.$transaction(
      async (tx) => {
        await this.lock(tx, link.id);
        const current = await tx.doctorFinancialAgreement.findFirst({
          where: { doctorClinicId: link.id, status: 'ACTIVE' },
          orderBy: { version: 'desc' },
          include: { scheduleItems: true, serviceRules: true },
        });
        if (current && norm.effectiveFrom < fromUtcDate(current.effectiveFrom)) {
          throw new AppError('VALIDATION_ERROR', 'New version cannot start before the current one', 400, {
            field: 'effectiveFrom',
            min: fromUtcDate(current.effectiveFrom),
          });
        }
        const maxVersion = await tx.doctorFinancialAgreement.aggregate({
          where: { doctorClinicId: link.id },
          _max: { version: true },
        });
        let cancelledIds: string[] = [];
        if (current) {
          await tx.doctorFinancialAgreement.update({
            where: { id: current.id },
            data: {
              status: 'SUPERSEDED',
              effectiveTo: toUtcDate(addDays(norm.effectiveFrom, -1)),
              supersededAt: new Date(),
            },
          });
          const future = await tx.doctorRentObligation.findMany({
            where: {
              agreementId: current.id,
              kind: 'RENT',
              cancelledAt: null,
              periodStart: { gte: toUtcDate(norm.effectiveFrom) },
            },
            select: { id: true },
          });
          for (const o of future) await this.cancelObligationTx(tx, o.id, actorUserId, 'agreement_superseded');
          cancelledIds = future.map((o) => o.id);
        }
        const created = await tx.doctorFinancialAgreement.create({
          data: {
            clinicId,
            doctorClinicId: link.id,
            version: (maxVersion._max.version ?? 0) + 1,
            model: norm.model,
            effectiveFrom: toUtcDate(norm.effectiveFrom),
            clinicShareBp: norm.clinicShareBp,
            rentEnabled: norm.rentEnabled,
            rentAmountUzs: norm.rentAmountUzs,
            recurrence: norm.recurrence,
            intervalValue: norm.intervalValue,
            intervalUnit: norm.intervalUnit,
            dueDayOfWeek: norm.dueDayOfWeek,
            dueDayOfMonth: norm.dueDayOfMonth,
            dailyBasis: norm.dailyBasis,
            oneTimeDueDate: norm.oneTimeDueDate ? toUtcDate(norm.oneTimeDueDate) : null,
            graceDays: norm.graceDays,
            prorateFirstPeriod: norm.prorateFirstPeriod,
            notes: norm.notes,
            createdByUserId: actorUserId,
            scheduleItems: {
              create: norm.scheduleItems.map((s) => ({
                dueDate: toUtcDate(s.dueDate),
                amountUzs: s.amountUzs,
                note: s.note,
              })),
            },
            serviceRules: { create: norm.serviceRules },
          },
        });
        let openingId: string | null = null;
        if (dto.openingBalance) {
          const asOf = dto.openingBalance.asOf ?? today;
          const ob = await tx.doctorRentObligation.create({
            data: {
              clinicId,
              doctorClinicId: link.id,
              agreementId: created.id,
              kind: 'OPENING_BALANCE',
              periodKey: `opening:${randomUUID()}`,
              periodStart: toUtcDate(asOf),
              periodEnd: toUtcDate(asOf),
              dueDate: toUtcDate(asOf),
              amountUzs: dto.openingBalance.amountUzs,
              note: dto.openingBalance.note?.trim() || null,
              createdByUserId: actorUserId,
            },
          });
          openingId = ob.id;
        }
        let priorId: string | null = null;
        if (dto.priorPayment) {
          const p = dto.priorPayment;
          const prior = await tx.doctorRentPayment.create({
            data: {
              clinicId,
              doctorClinicId: link.id,
              kind: 'PRIOR',
              status: 'CONFIRMED',
              amountUzs: p.amountUzs,
              paidAt: this.instantFor(p.paidAt, today, link.timezone, now),
              method: METHOD_IN[p.method ?? 'cash'],
              note: p.note?.trim() || null,
              coveredFrom: p.coveredFrom ? toUtcDate(p.coveredFrom) : null,
              coveredTo: p.coveredTo ? toUtcDate(p.coveredTo) : null,
              createdByUserId: actorUserId,
              confirmedByUserId: actorUserId,
              confirmedAt: new Date(),
            },
          });
          priorId = prior.id;
        }
        return { created, current, cancelledIds, openingId, priorId };
      },
      { timeout: 60_000 },
    );

    await this.audit.log({
      userId: actorUserId,
      clinicId,
      action: result.current ? 'doctor_finance.agreement.changed' : 'doctor_finance.agreement.created',
      entity: 'DoctorFinancialAgreement',
      entityId: result.created.id,
      before: result.current ? this.agreementAudit(result.current) : null,
      after: { ...this.agreementAudit(result.created), cancelledObligations: result.cancelledIds },
    });
    if (result.openingId) {
      await this.audit.log({
        userId: actorUserId,
        clinicId,
        action: 'doctor_finance.opening_balance.created',
        entity: 'DoctorRentObligation',
        entityId: result.openingId,
        after: dto.openingBalance,
      });
    }
    if (result.priorId) {
      await this.audit.log({
        userId: actorUserId,
        clinicId,
        action: 'doctor_finance.prior_payment.recorded',
        entity: 'DoctorRentPayment',
        entityId: result.priorId,
        after: dto.priorPayment,
      });
    }

    await this.syncLink(link.id, now);
    const resyncFrom = result.current
      ? [fromUtcDate(result.current.effectiveFrom), norm.effectiveFrom].sort()[0]
      : norm.effectiveFrom;
    await this.share.resyncDoctorClinic(link.id, resyncFrom);
    return this.detail(clinicId, doctorId, now);
  }

  private agreementAudit(a: {
    version: number;
    model: string;
    effectiveFrom: Date;
    effectiveTo: Date | null;
    clinicShareBp: number;
    rentEnabled: boolean;
    rentAmountUzs: number | null;
    recurrence: string | null;
    intervalValue: number | null;
    intervalUnit: string | null;
    dueDayOfWeek: number | null;
    dueDayOfMonth: number | null;
    dailyBasis: string | null;
    graceDays: number;
  }) {
    return {
      version: a.version,
      model: a.model,
      effectiveFrom: fromUtcDate(a.effectiveFrom),
      effectiveTo: a.effectiveTo ? fromUtcDate(a.effectiveTo) : null,
      clinicShareBp: a.clinicShareBp,
      rentEnabled: a.rentEnabled,
      rentAmountUzs: a.rentAmountUzs,
      recurrence: a.recurrence,
      intervalValue: a.intervalValue,
      intervalUnit: a.intervalUnit,
      dueDayOfWeek: a.dueDayOfWeek,
      dueDayOfMonth: a.dueDayOfMonth,
      dailyBasis: a.dailyBasis,
      graceDays: a.graceDays,
    };
  }

  async addOpeningBalance(
    clinicId: string,
    actorUserId: string,
    doctorId: string,
    dto: OpeningBalanceDto,
    now = new Date(),
  ) {
    const link = await this.resolveLink(clinicId, doctorId);
    const today = zonedYmd(now, link.timezone);
    const asOf = dto.asOf ?? today;
    if (asOf > today) {
      throw new AppError('VALIDATION_ERROR', 'Date is in the future', 400, { field: 'asOf' });
    }
    const current = await this.prisma.doctorFinancialAgreement.findFirst({
      where: { doctorClinicId: link.id, status: 'ACTIVE' },
      select: { id: true },
    });
    const ob = await this.prisma.doctorRentObligation.create({
      data: {
        clinicId,
        doctorClinicId: link.id,
        agreementId: current?.id ?? null,
        kind: 'OPENING_BALANCE',
        periodKey: `opening:${randomUUID()}`,
        periodStart: toUtcDate(asOf),
        periodEnd: toUtcDate(asOf),
        dueDate: toUtcDate(asOf),
        amountUzs: dto.amountUzs,
        note: dto.note?.trim() || null,
        createdByUserId: actorUserId,
      },
    });
    await this.audit.log({
      userId: actorUserId,
      clinicId,
      action: 'doctor_finance.opening_balance.created',
      entity: 'DoctorRentObligation',
      entityId: ob.id,
      after: { amountUzs: dto.amountUzs, asOf, note: dto.note ?? null },
    });
    await this.syncLink(link.id, now);
    return this.detail(clinicId, doctorId, now);
  }

  async cancelObligation(
    clinicId: string,
    actorUserId: string,
    doctorId: string,
    obligationId: string,
    reason: string,
    now = new Date(),
  ) {
    const link = await this.resolveLink(clinicId, doctorId);
    const before = await this.prisma.$transaction(async (tx) => {
      await this.lock(tx, link.id);
      const ob = await tx.doctorRentObligation.findFirst({
        where: { id: obligationId, doctorClinicId: link.id, clinicId },
      });
      if (!ob) throw new AppError('NOT_FOUND', 'Obligation not found', 404);
      if (ob.cancelledAt) throw new AppError('CONFLICT', 'Obligation is already cancelled', 409);
      await this.cancelObligationTx(tx, ob.id, actorUserId, reason.trim());
      return ob;
    });
    await this.audit.log({
      userId: actorUserId,
      clinicId,
      action: 'doctor_finance.obligation.cancelled',
      entity: 'DoctorRentObligation',
      entityId: obligationId,
      before: { status: before.status, amountUzs: before.amountUzs, paidUzs: before.paidUzs },
      after: { status: 'CANCELLED', reason: reason.trim() },
    });
    await this.syncLink(link.id, now);
    return this.detail(clinicId, doctorId, now);
  }

  // ─── Payments ───────────────────────────────────────────────────────────────

  private instantFor(day: Ymd, today: Ymd, tz: string, now: Date): Date {
    return day === today ? now : fromZonedTime(`${day}T12:00:00`, tz);
  }

  private checkPaymentDate(day: Ymd, today: Ymd) {
    if (day > today) throw new AppError('VALIDATION_ERROR', 'Payment date is in the future', 400, { field: 'paidAt' });
    if (diffDays(day, today) > MAX_BACKDATE_DAYS) {
      throw new AppError('VALIDATION_ERROR', 'Payment date is too old', 400, { field: 'paidAt' });
    }
  }

  private checkAttachment(clinicId: string, url?: string) {
    const prefix = `/files/private/${clinicId}/doctor-rent/`;
    if (url && !(url.startsWith(prefix) && RECEIPT_FILE.test(url.slice(prefix.length)))) {
      throw new AppError('VALIDATION_ERROR', 'Invalid attachment', 400, { field: 'attachmentUrl' });
    }
  }

  async uploadReceipt(
    clinicId: string,
    file: { buffer: Buffer; mimetype: string; size: number; originalname: string },
  ) {
    const allowed: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'application/pdf': '.pdf',
    };
    const ext = allowed[file.mimetype];
    if (!ext) throw new AppError('INVALID_FILE', 'Only JPG, PNG, WEBP or PDF', 400);
    const key = `private/${clinicId}/doctor-rent/${randomUUID()}${ext}`;
    await this.storage.upload({
      key,
      buffer: file.buffer,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      visibility: 'private',
    });
    return { url: `/files/${key}` };
  }

  async recordPayment(
    clinicId: string,
    actorUserId: string,
    doctorId: string,
    dto: RecordRentPaymentDto,
    now = new Date(),
  ) {
    const link = await this.resolveLink(clinicId, doctorId);
    const today = zonedYmd(now, link.timezone);
    const day = dto.paidAt ?? today;
    this.checkPaymentDate(day, today);
    this.checkAttachment(clinicId, dto.attachmentUrl);
    const payment = await this.prisma.doctorRentPayment.create({
      data: {
        clinicId,
        doctorClinicId: link.id,
        kind: 'PAYMENT',
        status: 'CONFIRMED',
        amountUzs: dto.amountUzs,
        paidAt: this.instantFor(day, today, link.timezone, now),
        method: METHOD_IN[dto.method],
        note: dto.note?.trim() || null,
        attachmentUrl: dto.attachmentUrl ?? null,
        createdByUserId: actorUserId,
        confirmedByUserId: actorUserId,
        confirmedAt: now,
      },
    });
    await this.audit.log({
      userId: actorUserId,
      clinicId,
      action: 'doctor_finance.payment.created',
      entity: 'DoctorRentPayment',
      entityId: payment.id,
      after: { amountUzs: dto.amountUzs, paidAt: day, method: dto.method, note: dto.note ?? null },
    });
    await this.syncLink(link.id, now);
    await this.notifyDoctor(link, 'PAYMENT_RECEIVED', { amount: dto.amountUzs, date: day, paymentId: payment.id });
    return this.detail(clinicId, doctorId, now);
  }

  async patchPayment(
    clinicId: string,
    actorUserId: string,
    doctorId: string,
    paymentId: string,
    dto: PatchRentPaymentDto,
    now = new Date(),
  ) {
    const link = await this.resolveLink(clinicId, doctorId);
    this.checkAttachment(clinicId, dto.attachmentUrl);
    const p = await this.prisma.doctorRentPayment.findFirst({
      where: { id: paymentId, doctorClinicId: link.id, clinicId },
    });
    if (!p) throw new AppError('NOT_FOUND', 'Payment not found', 404);
    if (p.status === 'VOIDED') throw new AppError('CONFLICT', 'Payment is voided', 409);
    const updated = await this.prisma.doctorRentPayment.update({
      where: { id: p.id },
      data: {
        ...(dto.method ? { method: METHOD_IN[dto.method] } : {}),
        ...(dto.note !== undefined ? { note: dto.note.trim() || null } : {}),
        ...(dto.attachmentUrl !== undefined ? { attachmentUrl: dto.attachmentUrl || null } : {}),
      },
    });
    await this.audit.log({
      userId: actorUserId,
      clinicId,
      action: 'doctor_finance.payment.edited',
      entity: 'DoctorRentPayment',
      entityId: p.id,
      before: { method: METHOD_OUT[p.method], note: p.note, attachmentUrl: p.attachmentUrl },
      after: { method: METHOD_OUT[updated.method], note: updated.note, attachmentUrl: updated.attachmentUrl },
    });
    return this.detail(clinicId, doctorId, now);
  }

  async voidPayment(
    clinicId: string,
    actorUserId: string,
    doctorId: string,
    paymentId: string,
    reason: string,
    now = new Date(),
  ) {
    const link = await this.resolveLink(clinicId, doctorId);
    const before = await this.prisma.$transaction(async (tx) => {
      await this.lock(tx, link.id);
      const p = await tx.doctorRentPayment.findFirst({
        where: { id: paymentId, doctorClinicId: link.id, clinicId },
        include: { allocations: { where: { reversedAt: null } } },
      });
      if (!p) throw new AppError('NOT_FOUND', 'Payment not found', 404);
      if (p.status === 'VOIDED' || p.status === 'REJECTED') {
        throw new AppError('CONFLICT', 'Payment is already voided', 409);
      }
      for (const a of p.allocations) {
        await tx.doctorRentObligation.update({
          where: { id: a.obligationId },
          data: { paidUzs: { decrement: a.amountUzs } },
        });
      }
      await tx.doctorRentAllocation.updateMany({
        where: { paymentId: p.id, reversedAt: null },
        data: { reversedAt: new Date() },
      });
      await tx.doctorRentPayment.update({
        where: { id: p.id },
        data: { status: 'VOIDED', voidedAt: new Date(), voidedByUserId: actorUserId, voidReason: reason.trim() },
      });
      return p;
    });
    await this.audit.log({
      userId: actorUserId,
      clinicId,
      action: 'doctor_finance.payment.voided',
      entity: 'DoctorRentPayment',
      entityId: paymentId,
      before: {
        status: before.status,
        amountUzs: before.amountUzs,
        allocations: before.allocations.map((a) => ({ obligationId: a.obligationId, amountUzs: a.amountUzs })),
      },
      after: { status: 'VOIDED', reason: reason.trim() },
    });
    await this.syncLink(link.id, now);
    return this.detail(clinicId, doctorId, now);
  }

  async reviewSubmission(
    clinicId: string,
    actorUserId: string,
    doctorId: string,
    paymentId: string,
    decision: 'confirm' | 'reject',
    reason?: string,
    now = new Date(),
  ) {
    const link = await this.resolveLink(clinicId, doctorId);
    const status: DoctorRentPaymentStatus = decision === 'confirm' ? 'CONFIRMED' : 'REJECTED';
    const p = await this.prisma.$transaction(async (tx) => {
      await this.lock(tx, link.id);
      const found = await tx.doctorRentPayment.findFirst({
        where: { id: paymentId, doctorClinicId: link.id, clinicId },
      });
      if (!found) throw new AppError('NOT_FOUND', 'Payment not found', 404);
      if (found.status !== 'SUBMITTED') throw new AppError('CONFLICT', 'Payment is not awaiting review', 409);
      await tx.doctorRentPayment.update({
        where: { id: found.id },
        data:
          decision === 'confirm'
            ? { status, confirmedByUserId: actorUserId, confirmedAt: now }
            : { status, voidedByUserId: actorUserId, voidedAt: now, voidReason: reason?.trim() || null },
      });
      return found;
    });
    await this.audit.log({
      userId: actorUserId,
      clinicId,
      action: decision === 'confirm' ? 'doctor_finance.payment.confirmed' : 'doctor_finance.payment.rejected',
      entity: 'DoctorRentPayment',
      entityId: p.id,
      before: { status: p.status },
      after: { status, reason: reason ?? null },
    });
    await this.syncLink(link.id, now);
    if (decision === 'confirm') {
      await this.notifyDoctor(link, 'PAYMENT_RECEIVED', {
        amount: p.amountUzs,
        date: zonedYmd(p.paidAt, link.timezone),
        paymentId: p.id,
      });
    }
    return this.detail(clinicId, doctorId, now);
  }

  // ─── Reads ──────────────────────────────────────────────────────────────────

  async detail(clinicId: string, doctorId: string, now = new Date(), opts: { forDoctor?: boolean } = {}) {
    const link = await this.resolveLink(clinicId, doctorId);
    await this.syncLink(link.id, now);
    const today = zonedYmd(now, link.timezone);
    const monthStart = startOfMonth(today);
    const monthStartInstant = fromZonedTime(`${monthStart}T00:00:00`, link.timezone);
    const shareTotalsQuery = (since?: Date) =>
      this.prisma.doctorRevenueShareEntry.groupBy({
        by: ['collectedBy'],
        where: { doctorClinicId: link.id, ...(since ? { occurredAt: { gte: since } } : {}) },
        _sum: { amountUzs: true, clinicShareUzs: true, doctorShareUzs: true },
      });
    // Totals come from uncapped queries; the capped lists below only feed the timeline.
    const [openObligations, advances, pendingSubmissions, shareAll, shareMonth] = await Promise.all([
      this.prisma.doctorRentObligation.findMany({
        where: { doctorClinicId: link.id, cancelledAt: null, status: { not: 'PAID' } },
        select: {
          id: true,
          amountUzs: true,
          paidUzs: true,
          dueDate: true,
          agreement: { select: { graceDays: true } },
        },
      }),
      this.advanceByLink(link.clinicId, link.id),
      this.prisma.doctorRentPayment.count({ where: { doctorClinicId: link.id, status: 'SUBMITTED' } }),
      shareTotalsQuery(),
      shareTotalsQuery(monthStartInstant),
    ]);
    const [agreements, obligations, payments, shareEntries] = await Promise.all([
      this.prisma.doctorFinancialAgreement.findMany({
        where: { doctorClinicId: link.id },
        orderBy: { version: 'desc' },
        include: { scheduleItems: { orderBy: { dueDate: 'asc' } }, serviceRules: true },
      }),
      this.prisma.doctorRentObligation.findMany({
        where: { doctorClinicId: link.id },
        orderBy: [{ dueDate: 'desc' }, { createdAt: 'desc' }],
        take: 500,
        include: { agreement: { select: { graceDays: true, version: true } } },
      }),
      this.prisma.doctorRentPayment.findMany({
        where: { doctorClinicId: link.id },
        orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
        take: 300,
        include: {
          allocations: {
            where: { reversedAt: null },
            select: { amountUzs: true, obligation: { select: { id: true, dueDate: true, periodStart: true, periodEnd: true, kind: true } } },
          },
        },
      }),
      this.prisma.doctorRevenueShareEntry.findMany({
        where: { doctorClinicId: link.id },
        orderBy: { occurredAt: 'desc' },
        take: 50,
        select: {
          id: true,
          kind: true,
          amountUzs: true,
          clinicShareUzs: true,
          doctorShareUzs: true,
          clinicShareBp: true,
          collectedBy: true,
          occurredAt: true,
          reason: true,
          payment: { select: { patientName: true, serviceName: true } },
        },
      }),
    ]);

    const userIds = new Set<string>();
    if (!opts.forDoctor) {
      for (const p of payments) {
        for (const id of [p.createdByUserId, p.voidedByUserId, p.confirmedByUserId]) if (id) userIds.add(id);
      }
      for (const o of obligations) if (o.cancelledByUserId) userIds.add(o.cancelledByUserId);
      for (const a of agreements) if (a.createdByUserId) userIds.add(a.createdByUserId);
    }
    const users = userIds.size
      ? await this.prisma.user.findMany({
          where: { id: { in: [...userIds] } },
          select: { id: true, firstName: true, lastName: true },
        })
      : [];
    const nameOf = (id: string | null) => {
      if (!id) return null;
      const u = users.find((x) => x.id === id);
      return u ? `${u.firstName} ${u.lastName}`.trim() : null;
    };

    const obligationRows = obligations.map((o) => {
      const outstanding = o.cancelledAt ? 0 : o.amountUzs - o.paidUzs;
      const status = obligationStatus(
        { amountUzs: o.amountUzs, paidUzs: o.paidUzs, dueDate: fromUtcDate(o.dueDate), cancelled: Boolean(o.cancelledAt) },
        today,
        o.agreement?.graceDays ?? 0,
      );
      return {
        id: o.id,
        kind: o.kind,
        agreementVersion: o.agreement?.version ?? null,
        periodStart: fromUtcDate(o.periodStart),
        periodEnd: fromUtcDate(o.periodEnd),
        dueDate: fromUtcDate(o.dueDate),
        amountUzs: o.amountUzs,
        paidUzs: o.cancelledAt ? 0 : o.paidUzs,
        outstandingUzs: outstanding,
        status,
        daysOverdue: status === 'OVERDUE' ? diffDays(fromUtcDate(o.dueDate), today) : 0,
        prorated: o.note === 'prorated',
        note: o.note === 'prorated' ? null : o.note,
        cancelledAt: o.cancelledAt?.toISOString() ?? null,
        cancelReason: o.cancelReason,
        cancelledBy: nameOf(o.cancelledByUserId),
      };
    });

    const paymentRows = payments.map((p) => {
      const allocated = p.allocations.reduce((s, a) => s + a.amountUzs, 0);
      return {
        id: p.id,
        kind: p.kind,
        status: p.status,
        amountUzs: p.amountUzs,
        allocatedUzs: allocated,
        unallocatedUzs: p.kind === 'PAYMENT' && p.status === 'CONFIRMED' ? p.amountUzs - allocated : 0,
        paidAt: p.paidAt.toISOString(),
        paidDate: zonedYmd(p.paidAt, link.timezone),
        method: METHOD_OUT[p.method],
        note: p.note,
        attachmentUrl: p.attachmentUrl,
        coveredFrom: p.coveredFrom ? fromUtcDate(p.coveredFrom) : null,
        coveredTo: p.coveredTo ? fromUtcDate(p.coveredTo) : null,
        createdBy: nameOf(p.createdByUserId),
        confirmedBy: nameOf(p.confirmedByUserId),
        voidedAt: p.voidedAt?.toISOString() ?? null,
        voidedBy: nameOf(p.voidedByUserId),
        voidReason: p.voidReason,
        createdAt: p.createdAt.toISOString(),
        allocations: p.allocations.map((a) => ({
          obligationId: a.obligation.id,
          amountUzs: a.amountUzs,
          dueDate: fromUtcDate(a.obligation.dueDate),
          periodStart: fromUtcDate(a.obligation.periodStart),
          periodEnd: fromUtcDate(a.obligation.periodEnd),
          kind: a.obligation.kind,
        })),
      };
    });

    const open = openObligations
      .map((o) => {
        const dueDate = fromUtcDate(o.dueDate);
        return {
          id: o.id,
          dueDate,
          outstandingUzs: o.amountUzs - o.paidUzs,
          status: obligationStatus(
            { amountUzs: o.amountUzs, paidUzs: o.paidUzs, dueDate, cancelled: false },
            today,
            o.agreement?.graceDays ?? 0,
          ),
        };
      })
      .filter((o) => o.outstandingUzs > 0);
    const totalDebt = open.filter((o) => o.dueDate <= today).reduce((s, o) => s + o.outstandingUzs, 0);
    const overdueDebt = open.filter((o) => o.status === 'OVERDUE').reduce((s, o) => s + o.outstandingUzs, 0);
    const upcoming = open.filter((o) => o.dueDate > today).reduce((s, o) => s + o.outstandingUzs, 0);
    const advance = advances.get(link.id) ?? 0;
    const current = agreements.find((a) => a.status === 'ACTIVE') ?? null;
    const nextOpen = [...open].filter((o) => o.dueDate >= today).sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
    let nextDue: { date: string; amountUzs: number; obligationId: string | null } | null = nextOpen
      ? { date: nextOpen.dueDate, amountUzs: nextOpen.outstandingUzs, obligationId: nextOpen.id }
      : null;
    if (!nextDue && current?.rentEnabled) {
      const rule = ruleFromAgreement(current);
      const date = rule ? nextDueAfter(rule, today) : null;
      if (date) {
        const item = current.scheduleItems.find((s) => fromUtcDate(s.dueDate) === date);
        nextDue = { date, amountUzs: item?.amountUzs ?? current.rentAmountUzs ?? 0, obligationId: null };
      }
    }

    const shareTotals = (groups: typeof shareAll) => {
      const t = { collectedUzs: 0, clinicShareUzs: 0, doctorShareUzs: 0, clinicOwesDoctorUzs: 0, doctorOwesClinicUzs: 0 };
      for (const g of groups) {
        const clinicShare = g._sum.clinicShareUzs ?? 0;
        const doctorShare = g._sum.doctorShareUzs ?? 0;
        t.collectedUzs += g._sum.amountUzs ?? 0;
        t.clinicShareUzs += clinicShare;
        t.doctorShareUzs += doctorShare;
        if (g.collectedBy === 'CLINIC') t.clinicOwesDoctorUzs += doctorShare;
        else t.doctorOwesClinicUzs += clinicShare;
      }
      return t;
    };

    return {
      doctor: {
        doctorId: link.doctorId,
        doctorClinicId: link.id,
        name: link.doctorName,
        photoUrl: link.photoUrl,
        isActive: link.isActive,
        startedAt: link.startedAt.toISOString(),
        endedAt: link.endedAt?.toISOString() ?? null,
      },
      clinic: { id: link.clinicId, name: link.clinicName, timezone: link.timezone },
      today,
      configured: Boolean(current),
      agreement: current ? this.agreementDto(current, nameOf) : null,
      history: agreements.map((a) => this.agreementDto(a, nameOf)),
      summary: {
        totalDebtUzs: totalDebt,
        overdueUzs: overdueDebt,
        upcomingUzs: upcoming,
        advanceUzs: advance,
        nextDue,
        aging: agingBuckets(open.map((o) => ({ dueDate: o.dueDate, outstanding: o.outstandingUzs })), today),
        pendingSubmissions,
        status: this.rowStatus(Boolean(current), totalDebt, overdueDebt, upcoming),
      },
      obligations: obligationRows,
      payments: paymentRows,
      revenueShare: {
        month: shareTotals(shareMonth),
        allTime: shareTotals(shareAll),
        entries: shareEntries.map((e) => ({
          id: e.id,
          kind: e.kind,
          amountUzs: e.amountUzs,
          clinicShareUzs: e.clinicShareUzs,
          doctorShareUzs: e.doctorShareUzs,
          clinicPercent: e.clinicShareBp / 100,
          collectedBy: e.collectedBy,
          occurredAt: e.occurredAt.toISOString(),
          reason: e.reason,
          patientName: e.payment.patientName,
          serviceName: e.payment.serviceName,
        })),
      },
    };
  }

  private agreementDto(
    a: Prisma.DoctorFinancialAgreementGetPayload<{ include: { scheduleItems: true; serviceRules: true } }>,
    nameOf: (id: string | null) => string | null,
  ) {
    return {
      id: a.id,
      version: a.version,
      model: a.model,
      status: a.status,
      effectiveFrom: fromUtcDate(a.effectiveFrom),
      effectiveTo: a.effectiveTo ? fromUtcDate(a.effectiveTo) : null,
      clinicPercent: a.clinicShareBp / 100,
      doctorPercent: (10_000 - a.clinicShareBp) / 100,
      rent: a.rentEnabled
        ? {
            amountUzs: a.rentAmountUzs,
            recurrence: a.recurrence,
            intervalValue: a.intervalValue,
            intervalUnit: a.intervalUnit,
            dueDayOfWeek: a.dueDayOfWeek,
            dueDayOfMonth: a.dueDayOfMonth,
            dailyBasis: a.dailyBasis,
            oneTimeDueDate: a.oneTimeDueDate ? fromUtcDate(a.oneTimeDueDate) : null,
            graceDays: a.graceDays,
            prorateFirstPeriod: a.prorateFirstPeriod,
            scheduleItems: a.scheduleItems.map((s) => ({
              dueDate: fromUtcDate(s.dueDate),
              amountUzs: s.amountUzs,
              note: s.note,
            })),
          }
        : null,
      serviceRules: a.serviceRules.map((r) => ({ serviceId: r.serviceId, clinicPercent: r.clinicShareBp / 100 })),
      notes: a.notes,
      createdAt: a.createdAt.toISOString(),
      createdBy: nameOf(a.createdByUserId),
      supersededAt: a.supersededAt?.toISOString() ?? null,
    };
  }

  private rowStatus(configured: boolean, debt: number, overdue: number, upcoming: number): RowStatus {
    if (overdue > 0) return 'overdue';
    if (debt > 0) return 'debtor';
    if (!configured) return 'not_configured';
    if (upcoming > 0) return 'pending';
    return 'paid';
  }

  /** Clinic-wide numbers for the Finance page. Statuses are derived for "today", not trusted from storage. */
  async overview(clinicId: string, query: OverviewQueryDto, now = new Date(), opts: { keepAll?: boolean } = {}) {
    const clinic = await this.clinicInfo(clinicId);
    const today = zonedYmd(now, clinic.timezone);
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    const [links, obligations, monthPayments, advances] = await Promise.all([
      this.prisma.doctorClinic.findMany({
        where: {
          clinicId,
          OR: [{ isActive: true }, { rentObligations: { some: {} } }, { financialAgreements: { some: {} } }],
        },
        include: {
          doctor: { select: { avatarUrl: true, user: { select: { firstName: true, lastName: true } } } },
          financialAgreements: {
            where: { status: 'ACTIVE' },
            orderBy: { version: 'desc' },
            take: 1,
            include: { scheduleItems: { orderBy: { dueDate: 'asc' } } },
          },
        },
      }),
      this.prisma.doctorRentObligation.findMany({
        where: {
          clinicId,
          cancelledAt: null,
          OR: [
            { status: { not: 'PAID' } },
            { dueDate: { gte: toUtcDate(monthStart), lte: toUtcDate(monthEnd) } },
          ],
        },
        select: {
          id: true,
          doctorClinicId: true,
          amountUzs: true,
          paidUzs: true,
          dueDate: true,
          agreement: { select: { graceDays: true } },
        },
      }),
      this.prisma.doctorRentPayment.aggregate({
        where: {
          clinicId,
          kind: 'PAYMENT',
          status: 'CONFIRMED',
          paidAt: {
            gte: fromZonedTime(`${monthStart}T00:00:00`, clinic.timezone),
            lte: fromZonedTime(`${monthEnd}T23:59:59.999`, clinic.timezone),
          },
        },
        _sum: { amountUzs: true },
      }),
      this.advanceByLink(clinicId),
    ]);

    type Agg = { debt: number; overdue: number; upcoming: number; next?: { date: string; amount: number } };
    const per = new Map<string, Agg>();
    const metrics = {
      expectedThisMonthUzs: 0,
      paidThisMonthUzs: monthPayments._sum.amountUzs ?? 0,
      remainingThisMonthUzs: 0,
      overdueUzs: 0,
      next7DaysUzs: 0,
      totalDebtUzs: 0,
      advanceUzs: 0,
    };
    const agingInput: { dueDate: string; outstanding: number }[] = [];
    const in7 = addDays(today, 7);
    for (const o of obligations) {
      const due = fromUtcDate(o.dueDate);
      const outstanding = o.amountUzs - o.paidUzs;
      const status = obligationStatus(
        { amountUzs: o.amountUzs, paidUzs: o.paidUzs, dueDate: due, cancelled: false },
        today,
        o.agreement?.graceDays ?? 0,
      );
      if (due >= monthStart && due <= monthEnd) {
        metrics.expectedThisMonthUzs += o.amountUzs;
        metrics.remainingThisMonthUzs += outstanding;
      }
      if (outstanding <= 0) continue;
      const agg = per.get(o.doctorClinicId) ?? { debt: 0, overdue: 0, upcoming: 0 };
      if (due <= today) {
        agg.debt += outstanding;
        metrics.totalDebtUzs += outstanding;
        agingInput.push({ dueDate: due, outstanding });
      } else {
        agg.upcoming += outstanding;
        if (due <= in7) metrics.next7DaysUzs += outstanding;
      }
      if (status === 'OVERDUE') {
        agg.overdue += outstanding;
        metrics.overdueUzs += outstanding;
      }
      if (due >= today && (!agg.next || due < agg.next.date)) agg.next = { date: due, amount: outstanding };
      per.set(o.doctorClinicId, agg);
    }

    const q = query.q?.trim().toLowerCase();
    const rows = links
      .map((l) => {
        const ag = l.financialAgreements[0] ?? null;
        const agg = per.get(l.id) ?? { debt: 0, overdue: 0, upcoming: 0 };
        const advance = advances.get(l.id) ?? 0;
        metrics.advanceUzs += advance;
        let next = agg.next ? { date: agg.next.date, amountUzs: agg.next.amount } : null;
        if (!next && ag?.rentEnabled) {
          const rule = ruleFromAgreement(ag);
          const date = rule ? nextDueAfter(rule, today) : null;
          if (date) {
            const item = ag.scheduleItems.find((s) => fromUtcDate(s.dueDate) === date);
            next = { date, amountUzs: item?.amountUzs ?? ag.rentAmountUzs ?? 0 };
          }
        }
        return {
          doctorId: l.doctorId,
          doctorClinicId: l.id,
          name: `${l.doctor.user.firstName} ${l.doctor.user.lastName}`.trim(),
          photoUrl: l.doctor.avatarUrl,
          isActive: l.isActive,
          agreement: ag
            ? {
                model: ag.model,
                clinicPercent: ag.clinicShareBp / 100,
                rentAmountUzs: ag.rentEnabled ? ag.rentAmountUzs : null,
                recurrence: ag.rentEnabled ? ag.recurrence : null,
                dueDayOfMonth: ag.dueDayOfMonth,
                dueDayOfWeek: ag.dueDayOfWeek,
                intervalValue: ag.intervalValue,
                intervalUnit: ag.intervalUnit,
                dailyBasis: ag.dailyBasis,
                effectiveFrom: fromUtcDate(ag.effectiveFrom),
              }
            : null,
          nextDue: next,
          debtUzs: agg.debt,
          overdueUzs: agg.overdue,
          upcomingUzs: agg.upcoming,
          advanceUzs: advance,
          status: this.rowStatus(Boolean(ag), agg.debt, agg.overdue, agg.upcoming),
        };
      })
      .filter((r) => opts.keepAll || r.isActive || r.debtUzs > 0 || r.agreement)
      .sort((a, b) => b.overdueUzs - a.overdueUzs || b.debtUzs - a.debtUzs || a.name.localeCompare(b.name));

    const counts = { all: rows.length, paid: 0, pending: 0, debtor: 0, overdue: 0, not_configured: 0 };
    for (const r of rows) counts[r.status] += 1;
    const status = query.status ?? 'all';
    const filtered = rows.filter(
      (r) =>
        (status === 'all' ||
          r.status === status ||
          (status === 'debtor' && r.status === 'overdue')) &&
        (!q || r.name.toLowerCase().includes(q)),
    );

    return {
      today,
      month: { from: monthStart, to: monthEnd },
      metrics,
      aging: agingBuckets(agingInput, today),
      counts,
      missingAgreements: rows.filter((r) => r.isActive && !r.agreement).length,
      rows: filtered,
    };
  }

  private async advanceByLink(clinicId: string, linkId?: string): Promise<Map<string, number>> {
    const linkFilter = linkId ? Prisma.sql`AND p."doctorClinicId" = ${linkId}` : Prisma.empty;
    const rows = await this.prisma.$queryRaw<{ doctorClinicId: string; credit: bigint }[]>`
      SELECT p."doctorClinicId",
             SUM(p."amountUzs" - COALESCE(a.allocated, 0))::bigint AS credit
      FROM "DoctorRentPayment" p
      LEFT JOIN (
        SELECT "paymentId", SUM("amountUzs") AS allocated
        FROM "DoctorRentAllocation"
        WHERE "reversedAt" IS NULL
        GROUP BY "paymentId"
      ) a ON a."paymentId" = p."id"
      WHERE p."clinicId" = ${clinicId} AND p."kind" = 'PAYMENT' AND p."status" = 'CONFIRMED' ${linkFilter}
      GROUP BY p."doctorClinicId"`;
    return new Map(rows.map((r) => [r.doctorClinicId, Number(r.credit)]));
  }

  async report(clinicId: string, query: ReportQueryDto, now = new Date()) {
    const clinic = await this.clinicInfo(clinicId);
    const today = zonedYmd(now, clinic.timezone);
    const from = query.from ?? startOfMonth(today);
    const to = query.to ?? endOfMonth(today);
    if (to < from) throw new AppError('VALIDATION_ERROR', 'Invalid range', 400, { field: 'to' });
    if (diffDays(from, to) > 3 * 366) throw new AppError('VALIDATION_ERROR', 'Range too long', 400, { field: 'from' });
    const fromInstant = fromZonedTime(`${from}T00:00:00`, clinic.timezone);
    const toInstant = fromZonedTime(`${to}T23:59:59.999`, clinic.timezone);

    let linkFilter: string | undefined;
    if (query.doctorId) {
      linkFilter = (await this.resolveLink(clinicId, query.doctorId)).id;
    }
    const overview = await this.overview(clinicId, {}, now, { keepAll: true });
    const [accrued, paid, shares] = await Promise.all([
      this.prisma.doctorRentObligation.groupBy({
        by: ['doctorClinicId'],
        where: {
          clinicId,
          cancelledAt: null,
          dueDate: { gte: toUtcDate(from), lte: toUtcDate(to) },
          ...(linkFilter ? { doctorClinicId: linkFilter } : {}),
        },
        _sum: { amountUzs: true },
      }),
      this.prisma.doctorRentPayment.groupBy({
        by: ['doctorClinicId'],
        where: {
          clinicId,
          kind: 'PAYMENT',
          status: 'CONFIRMED',
          paidAt: { gte: fromInstant, lte: toInstant },
          ...(linkFilter ? { doctorClinicId: linkFilter } : {}),
        },
        _sum: { amountUzs: true },
      }),
      this.prisma.doctorRevenueShareEntry.groupBy({
        by: ['doctorClinicId', 'collectedBy'],
        where: {
          clinicId,
          occurredAt: { gte: fromInstant, lte: toInstant },
          ...(linkFilter ? { doctorClinicId: linkFilter } : {}),
        },
        _sum: { amountUzs: true, clinicShareUzs: true, doctorShareUzs: true },
      }),
    ]);
    const sumOf = <T extends { doctorClinicId: string; _sum: { amountUzs: number | null } }>(list: T[], id: string) =>
      list.filter((x) => x.doctorClinicId === id).reduce((s, x) => s + (x._sum.amountUzs ?? 0), 0);

    const status = query.status ?? 'all';
    const rows = overview.rows
      .filter((r) => !linkFilter || r.doctorClinicId === linkFilter)
      .map((r) => {
        const sh = shares.filter((s) => s.doctorClinicId === r.doctorClinicId);
        return {
          doctorId: r.doctorId,
          name: r.name,
          isActive: r.isActive,
          model: r.agreement?.model ?? null,
          status: r.status,
          accruedUzs: sumOf(accrued, r.doctorClinicId),
          paidUzs: sumOf(paid, r.doctorClinicId),
          debtUzs: r.debtUzs,
          overdueUzs: r.overdueUzs,
          advanceUzs: r.advanceUzs,
          revenueCollectedUzs: sh.reduce((s, x) => s + (x._sum.amountUzs ?? 0), 0),
          revenueClinicShareUzs: sh.reduce((s, x) => s + (x._sum.clinicShareUzs ?? 0), 0),
          revenueDoctorShareUzs: sh.reduce((s, x) => s + (x._sum.doctorShareUzs ?? 0), 0),
        };
      })
      .filter(
        (r) =>
          r.isActive ||
          r.model ||
          r.debtUzs > 0 ||
          r.advanceUzs > 0 ||
          r.accruedUzs > 0 ||
          r.paidUzs > 0 ||
          r.revenueCollectedUzs !== 0,
      )
      .filter((r) => status === 'all' || r.status === status || (status === 'debtor' && r.status === 'overdue'));
    const totals = rows.reduce(
      (t, r) => ({
        accruedUzs: t.accruedUzs + r.accruedUzs,
        paidUzs: t.paidUzs + r.paidUzs,
        debtUzs: t.debtUzs + r.debtUzs,
        overdueUzs: t.overdueUzs + r.overdueUzs,
        revenueCollectedUzs: t.revenueCollectedUzs + r.revenueCollectedUzs,
        revenueDoctorShareUzs: t.revenueDoctorShareUzs + r.revenueDoctorShareUzs,
        revenueClinicShareUzs: t.revenueClinicShareUzs + r.revenueClinicShareUzs,
      }),
      {
        accruedUzs: 0,
        paidUzs: 0,
        debtUzs: 0,
        overdueUzs: 0,
        revenueCollectedUzs: 0,
        revenueDoctorShareUzs: 0,
        revenueClinicShareUzs: 0,
      },
    );
    return { from, to, totals, rows };
  }

  // ─── Reminder settings ──────────────────────────────────────────────────────

  async getReminderSettings(clinicId: string) {
    const s = await this.prisma.doctorRentReminderSettings.findUnique({ where: { clinicId } });
    return {
      remind3Days: s?.remind3Days ?? true,
      remind1Day: s?.remind1Day ?? true,
      remindDueDay: s?.remindDueDay ?? true,
      remindOverdue: s?.remindOverdue ?? true,
      overdueFrequency: s?.overdueFrequency ?? 'EVERY_3_DAYS',
      overdueCustomDays: s?.overdueCustomDays ?? null,
      notifyDoctor: s?.notifyDoctor ?? true,
      notifyStaff: s?.notifyStaff ?? true,
      sendHour: s?.sendHour ?? 9,
    };
  }

  async updateReminderSettings(clinicId: string, actorUserId: string, dto: ReminderSettingsDto) {
    const before = await this.getReminderSettings(clinicId);
    if (dto.overdueFrequency === 'CUSTOM' && !(dto.overdueCustomDays ?? before.overdueCustomDays)) {
      throw new AppError('VALIDATION_ERROR', 'Custom interval is required', 400, { field: 'overdueCustomDays' });
    }
    await this.prisma.doctorRentReminderSettings.upsert({
      where: { clinicId },
      create: { clinicId, ...before, ...dto, updatedByUserId: actorUserId },
      update: { ...dto, updatedByUserId: actorUserId },
    });
    const after = await this.getReminderSettings(clinicId);
    await this.audit.log({
      userId: actorUserId,
      clinicId,
      action: 'doctor_finance.reminder_settings.updated',
      entity: 'DoctorRentReminderSettings',
      entityId: clinicId,
      before,
      after,
    });
    return after;
  }

  // ─── Doctor self-service (own data only) ────────────────────────────────────

  private async doctorIdForUser(userId: string, clinicId: string | null | undefined) {
    if (!clinicId) throw new AppError('FORBIDDEN', 'No clinic context', 403);
    const doctor = await this.prisma.doctorProfile.findUnique({ where: { userId }, select: { id: true } });
    if (!doctor) throw new AppError('FORBIDDEN', 'Doctor profile not found', 403);
    const link = await this.prisma.doctorClinic.findFirst({
      where: { doctorId: doctor.id, clinicId },
      select: { id: true },
    });
    if (!link) throw new AppError('FORBIDDEN', 'Not linked to this clinic', 403);
    return doctor.id;
  }

  async myFinance(userId: string, clinicId: string | null | undefined, now = new Date()) {
    const doctorId = await this.doctorIdForUser(userId, clinicId);
    const d = await this.detail(clinicId!, doctorId, now, { forDoctor: true });
    return {
      ...d,
      history: undefined,
      agreement: d.agreement ? { ...d.agreement, createdBy: undefined, notes: undefined } : null,
      payments: d.payments.map((p) => ({ ...p, createdBy: undefined, confirmedBy: undefined, voidedBy: undefined })),
    };
  }

  async submitMyPayment(
    userId: string,
    clinicId: string | null | undefined,
    dto: RecordRentPaymentDto,
    now = new Date(),
  ) {
    const doctorId = await this.doctorIdForUser(userId, clinicId);
    const link = await this.resolveLink(clinicId!, doctorId);
    const today = zonedYmd(now, link.timezone);
    const day = dto.paidAt ?? today;
    this.checkPaymentDate(day, today);
    const p = await this.prisma.doctorRentPayment.create({
      data: {
        clinicId: link.clinicId,
        doctorClinicId: link.id,
        kind: 'PAYMENT',
        status: 'SUBMITTED',
        amountUzs: dto.amountUzs,
        paidAt: this.instantFor(day, today, link.timezone, now),
        method: METHOD_IN[dto.method],
        note: dto.note?.trim() || null,
        createdByUserId: userId,
      },
    });
    await this.audit.log({
      userId,
      clinicId: link.clinicId,
      action: 'doctor_finance.payment.submitted',
      entity: 'DoctorRentPayment',
      entityId: p.id,
      after: { amountUzs: dto.amountUzs, paidAt: day, method: dto.method },
    });
    const staff = await this.staffRecipients(link.clinicId);
    for (const s of staff) {
      const msg = rentMessage('staff', 'PAYMENT_SUBMITTED', s.locale, {
        amount: dto.amountUzs,
        date: day,
        clinicName: link.clinicName,
        doctorName: link.doctorName,
      });
      await this.notifications
        ?.create({
          userId: s.userId,
          type: 'DOCTOR_RENT_PAYMENT_SUBMITTED',
          ...msg,
          data: {
            doctorId: link.doctorId,
            paymentId: p.id,
            doctorName: link.doctorName,
            amountUzs: dto.amountUzs,
            date: day,
          },
        })
        .catch((e: unknown) => this.logger.warn(`notify failed: ${e instanceof Error ? e.message : e}`));
    }
    return this.myFinance(userId, clinicId, now);
  }

  // ─── Notifications helpers ──────────────────────────────────────────────────

  /** Active owner/admin/accountant members whose effective permissions include doctor_finance:read. */
  async staffRecipients(clinicId: string): Promise<{ userId: string; locale: string }[]> {
    const members = await this.prisma.clinicMember.findMany({
      where: { clinicId, isActive: true, role: { in: STAFF_ROLES } },
      select: { id: true, userId: true, role: true, user: { select: { locale: true, isActive: true } } },
    });
    const out: { userId: string; locale: string }[] = [];
    for (const m of members) {
      if (!m.user.isActive) continue;
      const perms = await this.permissions.getEffectivePermissions({ roles: [m.role], membershipId: m.id });
      if (perms.includes(DOCTOR_FINANCE_PERMISSIONS.read)) out.push({ userId: m.userId, locale: m.user.locale });
    }
    return out;
  }

  private async notifyDoctor(
    link: LinkCtx,
    kind: 'PAYMENT_RECEIVED',
    v: { amount: number; date: string; paymentId: string },
  ) {
    if (!this.notifications || !link.isActive) return;
    const user = await this.prisma.user.findUnique({ where: { id: link.doctorUserId }, select: { locale: true } });
    const msg = rentMessage('doctor', kind, user?.locale, {
      amount: v.amount,
      date: v.date,
      clinicName: link.clinicName,
      doctorName: link.doctorName,
    });
    await this.notifications
      .create({
        userId: link.doctorUserId,
        type: 'DOCTOR_RENT_PAYMENT',
        ...msg,
        data: { clinicId: link.clinicId, paymentId: v.paymentId },
      })
      .catch((e: unknown) => this.logger.warn(`notify failed: ${e instanceof Error ? e.message : e}`));
  }
}

export type { ObligationStatus };
