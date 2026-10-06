import { Injectable, Logger } from '@nestjs/common';
import { PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { toUtcDate, zonedYmd } from './engine/dates';
import { FULL_SHARE_BP, splitShare } from './engine/ledger';

type Desired = {
  doctorClinicId: string;
  agreementId: string;
  amountUzs: number;
  clinicShareUzs: number;
  doctorShareUzs: number;
  clinicShareBp: number;
  collectedBy: 'CLINIC' | 'DOCTOR';
  occurredAt: Date;
};

/**
 * Keeps the append-only revenue-share ledger in line with real patient payments.
 * Only PAID payments count (a COMPLETED appointment alone is not revenue); refunds are
 * negative payments that mirror the original split. Never updates or deletes entries.
 */
@Injectable()
export class RevenueShareService {
  private readonly logger = new Logger(RevenueShareService.name);

  constructor(private readonly prisma: PrismaService) {}

  async syncPayment(paymentId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`share:${paymentId}`}))`;
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: {
          refundOf: { select: { paidAt: true, createdAt: true, serviceId: true } },
          clinic: { select: { timezone: true } },
        },
      });
      if (!payment) return;
      const desired = await this.desiredFor(tx, payment);
      const entries = await tx.doctorRevenueShareEntry.findMany({
        where: { paymentId },
        orderBy: { createdAt: 'asc' },
      });
      const net = entries.reduce(
        (s, e) => ({
          amount: s.amount + e.amountUzs,
          clinic: s.clinic + e.clinicShareUzs,
          doctor: s.doctor + e.doctorShareUzs,
        }),
        { amount: 0, clinic: 0, doctor: 0 },
      );
      const last = entries[entries.length - 1];
      const matches = desired
        ? net.amount === desired.amountUzs &&
          net.doctor === desired.doctorShareUzs &&
          last?.doctorClinicId === desired.doctorClinicId &&
          last?.agreementId === desired.agreementId
        : net.amount === 0 && net.doctor === 0 && net.clinic === 0;
      if (matches) return;

      if (last && (net.amount !== 0 || net.doctor !== 0 || net.clinic !== 0)) {
        await tx.doctorRevenueShareEntry.create({
          data: {
            clinicId: payment.clinicId,
            doctorClinicId: last.doctorClinicId,
            agreementId: last.agreementId,
            paymentId,
            kind: 'REVERSAL',
            amountUzs: -net.amount,
            clinicShareUzs: -net.clinic,
            doctorShareUzs: -net.doctor,
            clinicShareBp: last.clinicShareBp,
            collectedBy: last.collectedBy,
            reason: desired ? 'payment_changed' : 'payment_voided',
            occurredAt: new Date(),
          },
        });
      }
      if (desired) {
        await tx.doctorRevenueShareEntry.create({
          data: {
            clinicId: payment.clinicId,
            paymentId,
            kind: 'ACCRUAL',
            reason: payment.refundOfId ? 'refund' : null,
            ...desired,
          },
        });
      }
    });
  }

  /** Re-evaluates every payment of a doctor in a clinic since `fromYmd` (after agreement changes). */
  async resyncDoctorClinic(doctorClinicId: string, fromYmd: string): Promise<number> {
    const link = await this.prisma.doctorClinic.findUnique({
      where: { id: doctorClinicId },
      select: { doctorId: true, clinicId: true },
    });
    if (!link) return 0;
    const from = new Date(toUtcDate(fromYmd).getTime() - 86_400_000);
    const payments = await this.prisma.payment.findMany({
      where: {
        clinicId: link.clinicId,
        doctorId: link.doctorId,
        OR: [{ paidAt: { gte: from } }, { paidAt: null, createdAt: { gte: from } }],
      },
      select: { id: true },
      take: 5000,
    });
    for (const p of payments) {
      await this.syncPayment(p.id).catch((e: unknown) =>
        this.logger.warn(`share sync failed for ${p.id}: ${e instanceof Error ? e.message : e}`),
      );
    }
    return payments.length;
  }

  private async desiredFor(
    tx: Prisma.TransactionClient,
    payment: {
      clinicId: string;
      doctorId: string | null;
      serviceId: string | null;
      amountUzs: number;
      status: PaymentStatus;
      paidAt: Date | null;
      createdAt: Date;
      collectedBy: 'CLINIC' | 'DOCTOR';
      refundOf: { paidAt: Date | null; createdAt: Date; serviceId: string | null } | null;
      clinic: { timezone: string };
    },
  ): Promise<Desired | null> {
    if (payment.status !== PaymentStatus.PAID || payment.amountUzs === 0 || !payment.doctorId) {
      return null;
    }
    const source = payment.refundOf ?? payment;
    const day = zonedYmd(source.paidAt ?? source.createdAt, payment.clinic.timezone || 'Asia/Tashkent');
    const link = await tx.doctorClinic.findFirst({
      where: { doctorId: payment.doctorId, clinicId: payment.clinicId },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
      select: { id: true },
    });
    if (!link) return null;
    const date = toUtcDate(day);
    const agreement = await tx.doctorFinancialAgreement.findFirst({
      where: {
        doctorClinicId: link.id,
        effectiveFrom: { lte: date },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: date } }],
      },
      orderBy: { version: 'desc' },
      include: { serviceRules: true },
    });
    if (!agreement) return null;
    const serviceId = payment.serviceId ?? source.serviceId;
    const rule = serviceId ? agreement.serviceRules.find((r) => r.serviceId === serviceId) : undefined;
    const bp = rule?.clinicShareBp ?? agreement.clinicShareBp;
    if (bp >= FULL_SHARE_BP) return null;
    const split = splitShare(payment.amountUzs, bp);
    return {
      doctorClinicId: link.id,
      agreementId: agreement.id,
      amountUzs: payment.amountUzs,
      clinicShareUzs: split.clinic,
      doctorShareUzs: split.doctor,
      clinicShareBp: bp,
      collectedBy: payment.collectedBy,
      occurredAt: payment.paidAt ?? payment.createdAt,
    };
  }
}
