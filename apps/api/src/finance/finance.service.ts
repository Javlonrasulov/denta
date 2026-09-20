import { Injectable } from '@nestjs/common';
import {
  ChargeStatus,
  PaymentMethod,
  PaymentStatus,
} from '@prisma/client';
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns';
import { AppError } from '../common/filters/global-exception.filter';
import {
  mapPaymentMethod,
  mapPaymentStatus,
} from '../common/utils/enum-map.util';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateFinanceRecordDto,
  FinancePeriod,
  PatchFinanceRecordDto,
  RecordChargePaymentDto,
} from './dto/finance.dto';

export type FinanceRecordDto = {
  id: string;
  date: string;
  time?: string;
  patientName?: string;
  patientId?: string;
  doctorName?: string;
  doctorId?: string;
  serviceName: string;
  amount: number;
  type: 'income' | 'expense';
  paymentStatus: ReturnType<typeof mapPaymentStatus>;
  paymentMethod?: ReturnType<typeof mapPaymentMethod> | 'other';
  notes?: string;
  chargeId?: string;
  appointmentId?: string;
};

export type ChargeDto = {
  id: string;
  clinicId: string;
  patientId: string;
  appointmentId: string;
  serviceId?: string;
  doctorId?: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'unpaid' | 'partially_paid' | 'paid' | 'cancelled';
  patientName?: string;
  doctorName?: string;
  serviceName?: string;
  createdAt: string;
};

export type FinanceSummaryDto = {
  period: FinancePeriod;
  revenue: number;
  expenses: number;
  outstanding: number;
  net: number;
  unpaidCharges: number;
  partiallyPaidCharges: number;
};

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  private periodRange(period: FinancePeriod): { from: Date; to: Date } {
    const now = new Date();
    switch (period) {
      case 'today':
        return { from: startOfDay(now), to: endOfDay(now) };
      case 'week':
        return {
          from: startOfWeek(now, { weekStartsOn: 1 }),
          to: endOfWeek(now, { weekStartsOn: 1 }),
        };
      case 'year':
        return { from: startOfYear(now), to: endOfYear(now) };
      default:
        return { from: startOfMonth(now), to: endOfMonth(now) };
    }
  }

  private mapChargeStatus(
    status: ChargeStatus,
  ): ChargeDto['status'] {
    switch (status) {
      case ChargeStatus.PARTIALLY_PAID:
        return 'partially_paid';
      case ChargeStatus.PAID:
        return 'paid';
      case ChargeStatus.CANCELLED:
        return 'cancelled';
      default:
        return 'unpaid';
    }
  }

  private toChargeDto(c: {
    id: string;
    clinicId: string;
    patientId: string;
    appointmentId: string;
    serviceId: string | null;
    doctorId: string | null;
    amountUzs: number;
    paidAmountUzs: number;
    remainingUzs: number;
    status: ChargeStatus;
    patientName: string | null;
    doctorName: string | null;
    serviceName: string | null;
    createdAt: Date;
  }): ChargeDto {
    return {
      id: c.id,
      clinicId: c.clinicId,
      patientId: c.patientId,
      appointmentId: c.appointmentId,
      serviceId: c.serviceId ?? undefined,
      doctorId: c.doctorId ?? undefined,
      amount: c.amountUzs,
      paidAmount: c.paidAmountUzs,
      remainingAmount: c.remainingUzs,
      status: this.mapChargeStatus(c.status),
      patientName: c.patientName ?? undefined,
      doctorName: c.doctorName ?? undefined,
      serviceName: c.serviceName ?? undefined,
      createdAt: c.createdAt.toISOString(),
    };
  }

  async summary(
    clinicId: string,
    period: FinancePeriod = 'month',
  ): Promise<FinanceSummaryDto> {
    const { from, to } = this.periodRange(period);

    const [paidAgg, expenseAgg, outstandingAgg, unpaidCount, partialCount] =
      await Promise.all([
        this.prisma.payment.aggregate({
          where: {
            clinicId,
            status: PaymentStatus.PAID,
            paidAt: { gte: from, lte: to },
          },
          _sum: { amountUzs: true },
        }),
        this.prisma.expense.aggregate({
          where: { clinicId, date: { gte: from, lte: to } },
          _sum: { amountUzs: true },
        }),
        this.prisma.appointmentCharge.aggregate({
          where: {
            clinicId,
            status: {
              in: [ChargeStatus.UNPAID, ChargeStatus.PARTIALLY_PAID],
            },
          },
          _sum: { remainingUzs: true },
        }),
        this.prisma.appointmentCharge.count({
          where: { clinicId, status: ChargeStatus.UNPAID },
        }),
        this.prisma.appointmentCharge.count({
          where: { clinicId, status: ChargeStatus.PARTIALLY_PAID },
        }),
      ]);

    const revenue = paidAgg._sum.amountUzs ?? 0;
    const expenses = expenseAgg._sum.amountUzs ?? 0;
    const outstanding = outstandingAgg._sum.remainingUzs ?? 0;

    return {
      period,
      revenue,
      expenses,
      outstanding,
      net: revenue - expenses,
      unpaidCharges: unpaidCount,
      partiallyPaidCharges: partialCount,
    };
  }

  async listCharges(
    clinicId: string,
    opts?: { patientId?: string; status?: string },
  ): Promise<ChargeDto[]> {
    const statusFilter = opts?.status
      ? this.toChargeStatus(opts.status)
      : undefined;

    const rows = await this.prisma.appointmentCharge.findMany({
      where: {
        clinicId,
        ...(opts?.patientId ? { patientId: opts.patientId } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    return rows.map((r) => this.toChargeDto(r));
  }

  async getCharge(clinicId: string, chargeId: string): Promise<ChargeDto> {
    const row = await this.prisma.appointmentCharge.findFirst({
      where: { id: chargeId, clinicId },
    });
    if (!row) throw new AppError('NOT_FOUND', 'Charge not found', 404);
    return this.toChargeDto(row);
  }

  async patientFinance(clinicId: string, patientId: string) {
    const [charges, payments] = await Promise.all([
      this.prisma.appointmentCharge.findMany({
        where: { clinicId, patientId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.findMany({
        where: {
          clinicId,
          patientId,
          status: PaymentStatus.PAID,
        },
        orderBy: { paidAt: 'desc' },
        take: 200,
      }),
    ]);

    const totalDebt = charges
      .filter(
        (c) =>
          c.status === ChargeStatus.UNPAID ||
          c.status === ChargeStatus.PARTIALLY_PAID,
      )
      .reduce((s, c) => s + c.remainingUzs, 0);

    return {
      totalDebt,
      charges: charges.map((c) => this.toChargeDto(c)),
      payments: payments.map((p) => this.paymentToRecord(p)),
    };
  }

  /**
   * Record a real payment against an appointment charge.
   * Updates charge paid/remaining/status atomically.
   */
  async recordChargePayment(
    clinicId: string,
    chargeId: string,
    dto: RecordChargePaymentDto,
  ): Promise<{ charge: ChargeDto; payment: FinanceRecordDto }> {
    const result = await this.prisma.$transaction(async (tx) => {
      const charge = await tx.appointmentCharge.findFirst({
        where: { id: chargeId, clinicId },
      });
      if (!charge) throw new AppError('NOT_FOUND', 'Charge not found', 404);
      if (charge.status === ChargeStatus.CANCELLED) {
        throw new AppError('VALIDATION_ERROR', 'Charge is cancelled', 400);
      }
      if (charge.status === ChargeStatus.PAID || charge.remainingUzs <= 0) {
        throw new AppError('VALIDATION_ERROR', 'Charge is already paid', 400);
      }
      if (dto.amount <= 0) {
        throw new AppError('VALIDATION_ERROR', 'Amount must be positive', 400);
      }
      if (dto.amount > charge.remainingUzs) {
        throw new AppError(
          'VALIDATION_ERROR',
          'Amount exceeds remaining balance',
          400,
        );
      }

      const paidAmountUzs = charge.paidAmountUzs + dto.amount;
      const remainingUzs = charge.amountUzs - paidAmountUzs;
      const status =
        remainingUzs <= 0
          ? ChargeStatus.PAID
          : paidAmountUzs > 0
            ? ChargeStatus.PARTIALLY_PAID
            : ChargeStatus.UNPAID;

      const payment = await tx.payment.create({
        data: {
          clinicId,
          patientId: charge.patientId,
          appointmentId: charge.appointmentId,
          chargeId: charge.id,
          serviceId: charge.serviceId,
          doctorId: charge.doctorId,
          amountUzs: dto.amount,
          method: this.toPaymentMethod(dto.method) ?? PaymentMethod.CASH,
          status: PaymentStatus.PAID,
          paidAt: new Date(),
          notes: dto.notes,
          patientName: charge.patientName,
          doctorName: charge.doctorName,
          serviceName: charge.serviceName,
        },
      });

      const updated = await tx.appointmentCharge.update({
        where: { id: charge.id },
        data: {
          paidAmountUzs,
          remainingUzs: Math.max(0, remainingUzs),
          status,
        },
      });

      return { charge: updated, payment };
    });

    return {
      charge: this.toChargeDto(result.charge),
      payment: this.paymentToRecord(result.payment),
    };
  }

  async listForClinic(
    clinicId: string,
    period: FinancePeriod = 'month',
  ): Promise<FinanceRecordDto[]> {
    const { from, to } = this.periodRange(period);
    const [payments, expenses] = await Promise.all([
      this.prisma.payment.findMany({
        where: {
          clinicId,
          OR: [
            { paidAt: { gte: from, lte: to } },
            { paidAt: null, createdAt: { gte: from, lte: to } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 500,
      }),
      this.prisma.expense.findMany({
        where: { clinicId, date: { gte: from, lte: to } },
        orderBy: { date: 'desc' },
        take: 500,
      }),
    ]);

    const income = payments.map((p) => this.paymentToRecord(p));
    const expense = expenses.map((e) => this.expenseToRecord(e));
    return [...income, ...expense].sort((a, b) =>
      `${b.date}${b.time ?? ''}`.localeCompare(`${a.date}${a.time ?? ''}`),
    );
  }

  async listForDoctor(
    userId: string,
    period: FinancePeriod = 'month',
  ): Promise<FinanceRecordDto[]> {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { userId },
    });
    if (!doctor) throw new AppError('NOT_FOUND', 'Doctor profile not found', 404);

    const { from, to } = this.periodRange(period);
    const payments = await this.prisma.payment.findMany({
      where: {
        doctorId: doctor.id,
        OR: [
          { paidAt: { gte: from, lte: to } },
          { paidAt: null, createdAt: { gte: from, lte: to } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    return payments.map((p) => this.paymentToRecord(p));
  }

  async create(clinicId: string, dto: CreateFinanceRecordDto) {
    // Prefer charge-linked payment when appointmentId provided
    if (dto.type === 'income' && dto.appointmentId) {
      const charge = await this.prisma.appointmentCharge.findUnique({
        where: { appointmentId: dto.appointmentId },
      });
      if (charge && charge.clinicId === clinicId) {
        const result = await this.recordChargePayment(clinicId, charge.id, {
          amount: dto.amount,
          method: dto.paymentMethod ?? 'cash',
          notes: dto.notes,
        });
        return result.payment;
      }
    }

    if (dto.type === 'income' && dto.chargeId) {
      const result = await this.recordChargePayment(clinicId, dto.chargeId, {
        amount: dto.amount,
        method: dto.paymentMethod ?? 'cash',
        notes: dto.notes,
      });
      return result.payment;
    }

    if (dto.type === 'income') {
      const payment = await this.prisma.payment.create({
        data: {
          clinicId,
          amountUzs: dto.amount,
          serviceName: dto.serviceName,
          patientName: dto.patientName,
          patientId: dto.patientId,
          doctorName: dto.doctorName,
          doctorId: dto.doctorId,
          appointmentId: dto.appointmentId,
          status: this.toPaymentStatus(dto.paymentStatus ?? 'paid'),
          method: this.toPaymentMethod(dto.paymentMethod),
          notes: dto.notes,
          paidAt:
            (dto.paymentStatus ?? 'paid') === 'paid'
              ? dto.date
                ? new Date(dto.date)
                : new Date()
              : null,
        },
      });
      return this.paymentToRecord(payment);
    }

    const expense = await this.prisma.expense.create({
      data: {
        clinicId,
        amountUzs: dto.amount,
        description: dto.serviceName,
        date: dto.date ? new Date(dto.date) : new Date(),
      },
    });
    return this.expenseToRecord(expense);
  }

  async patch(clinicId: string, id: string, dto: PatchFinanceRecordDto) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, clinicId },
    });
    if (payment) {
      const updated = await this.prisma.payment.update({
        where: { id },
        data: {
          ...(dto.amount !== undefined ? { amountUzs: dto.amount } : {}),
          ...(dto.serviceName !== undefined
            ? { serviceName: dto.serviceName }
            : {}),
          ...(dto.paymentStatus !== undefined
            ? { status: this.toPaymentStatus(dto.paymentStatus) }
            : {}),
          ...(dto.paymentMethod !== undefined
            ? { method: this.toPaymentMethod(dto.paymentMethod) }
            : {}),
          ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
          ...(dto.paymentStatus === 'paid' && !payment.paidAt
            ? { paidAt: new Date() }
            : {}),
        },
      });
      return this.paymentToRecord(updated);
    }

    const expense = await this.prisma.expense.findFirst({
      where: { id, clinicId },
    });
    if (!expense) throw new AppError('NOT_FOUND', 'Finance record not found', 404);

    const updated = await this.prisma.expense.update({
      where: { id },
      data: {
        ...(dto.amount !== undefined ? { amountUzs: dto.amount } : {}),
        ...(dto.serviceName !== undefined
          ? { description: dto.serviceName }
          : {}),
      },
    });
    return this.expenseToRecord(updated);
  }

  private paymentToRecord(p: {
    id: string;
    amountUzs: number;
    serviceName: string | null;
    patientName: string | null;
    patientId: string | null;
    doctorName: string | null;
    doctorId: string | null;
    status: PaymentStatus;
    method: PaymentMethod | null;
    notes: string | null;
    paidAt: Date | null;
    createdAt: Date;
    chargeId?: string | null;
    appointmentId?: string | null;
  }): FinanceRecordDto {
    const when = p.paidAt ?? p.createdAt;
    return {
      id: p.id,
      date: format(when, 'yyyy-MM-dd'),
      time: format(when, 'HH:mm'),
      patientName: p.patientName ?? undefined,
      patientId: p.patientId ?? undefined,
      doctorName: p.doctorName ?? undefined,
      doctorId: p.doctorId ?? undefined,
      serviceName: p.serviceName ?? 'Payment',
      amount: p.amountUzs,
      type: 'income',
      paymentStatus: mapPaymentStatus(p.status),
      paymentMethod: mapPaymentMethod(p.method),
      notes: p.notes ?? undefined,
      chargeId: p.chargeId ?? undefined,
      appointmentId: p.appointmentId ?? undefined,
    };
  }

  private expenseToRecord(e: {
    id: string;
    amountUzs: number;
    description: string | null;
    date: Date;
  }): FinanceRecordDto {
    return {
      id: e.id,
      date: format(e.date, 'yyyy-MM-dd'),
      serviceName: e.description ?? 'Expense',
      amount: e.amountUzs,
      type: 'expense',
      paymentStatus: 'paid',
    };
  }

  private toPaymentStatus(
    s: 'paid' | 'pending' | 'overdue' | 'partial' | 'cancelled',
  ): PaymentStatus {
    switch (s) {
      case 'paid':
        return PaymentStatus.PAID;
      case 'overdue':
        return PaymentStatus.OVERDUE;
      case 'partial':
        return PaymentStatus.PARTIAL;
      case 'cancelled':
        return PaymentStatus.CANCELLED;
      default:
        return PaymentStatus.PENDING;
    }
  }

  private toPaymentMethod(
    m?: 'card' | 'cash' | 'transfer' | 'other',
  ): PaymentMethod | undefined {
    if (!m) return undefined;
    switch (m) {
      case 'card':
        return PaymentMethod.CARD;
      case 'transfer':
        return PaymentMethod.TRANSFER;
      case 'other':
        return PaymentMethod.OTHER;
      default:
        return PaymentMethod.CASH;
    }
  }

  private toChargeStatus(s: string): ChargeStatus | undefined {
    switch (s) {
      case 'unpaid':
      case 'UNPAID':
        return ChargeStatus.UNPAID;
      case 'partially_paid':
      case 'PARTIALLY_PAID':
        return ChargeStatus.PARTIALLY_PAID;
      case 'paid':
      case 'PAID':
        return ChargeStatus.PAID;
      case 'cancelled':
      case 'CANCELLED':
        return ChargeStatus.CANCELLED;
      default:
        return undefined;
    }
  }
}
