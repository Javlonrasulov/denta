import { Injectable } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import {
  addDays,
  endOfDay,
  format,
  startOfDay,
  subDays,
} from 'date-fns';
import { AppError } from '../common/filters/global-exception.filter';
import { PrismaService } from '../prisma/prisma.service';
import { PatientFlowPeriod } from './dto/analytics.dto';

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(clinicId: string) {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalPatients,
      appointmentsToday,
      completedToday,
      newPatientsMonth,
      paymentsToday,
      paymentsMonth,
      cancelledMonth,
      appointmentsMonth,
    ] = await Promise.all([
      this.prisma.patientClinic.count({ where: { clinicId, isActive: true } }),
      this.prisma.appointment.count({
        where: {
          clinicId,
          startsAt: { gte: todayStart, lte: todayEnd },
          status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] },
        },
      }),
      this.prisma.appointment.count({
        where: {
          clinicId,
          startsAt: { gte: todayStart, lte: todayEnd },
          status: AppointmentStatus.COMPLETED,
        },
      }),
      this.prisma.patientClinic.count({
        where: { clinicId, createdAt: { gte: monthStart } },
      }),
      this.prisma.payment.aggregate({
        where: {
          clinicId,
          status: 'PAID',
          paidAt: { gte: todayStart, lte: todayEnd },
        },
        _sum: { amountUzs: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          clinicId,
          status: 'PAID',
          paidAt: { gte: monthStart },
        },
        _sum: { amountUzs: true },
      }),
      this.prisma.appointment.count({
        where: {
          clinicId,
          startsAt: { gte: monthStart },
          status: { in: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] },
        },
      }),
      this.prisma.appointment.count({
        where: { clinicId, startsAt: { gte: monthStart } },
      }),
    ]);

    return {
      totalPatients,
      appointmentsToday,
      completedToday,
      newPatientsThisMonth: newPatientsMonth,
      revenueToday: paymentsToday._sum.amountUzs ?? 0,
      revenueThisMonth: paymentsMonth._sum.amountUzs ?? 0,
      cancellationRate:
        appointmentsMonth > 0
          ? Math.round((cancelledMonth / appointmentsMonth) * 1000) / 10
          : 0,
    };
  }

  async getPatientFlow(clinicId: string, period: PatientFlowPeriod = '7d') {
    const days =
      period === '7d'
        ? 7
        : period === '30d'
          ? 30
          : period === '3m'
            ? 90
            : 365;
    const end = endOfDay(new Date());
    const start = startOfDay(subDays(end, days - 1));

    const links = await this.prisma.patientClinic.findMany({
      where: {
        clinicId,
        OR: [
          { createdAt: { gte: start, lte: end } },
          { lastVisitAt: { gte: start, lte: end } },
        ],
      },
      select: { createdAt: true, lastVisitAt: true },
    });

    const bucketMap = new Map<
      string,
      { total: number; new: number; returning: number; date: string }
    >();

    for (let i = 0; i < days; i++) {
      const d = addDays(start, i);
      const key = format(d, 'yyyy-MM-dd');
      bucketMap.set(key, { total: 0, new: 0, returning: 0, date: key });
    }

    for (const link of links) {
      const createdKey = format(link.createdAt, 'yyyy-MM-dd');
      if (bucketMap.has(createdKey)) {
        const b = bucketMap.get(createdKey)!;
        b.new += 1;
        b.total += 1;
      }
      if (link.lastVisitAt) {
        const visitKey = format(link.lastVisitAt, 'yyyy-MM-dd');
        if (bucketMap.has(visitKey) && visitKey !== createdKey) {
          const b = bucketMap.get(visitKey)!;
          b.returning += 1;
          b.total += 1;
        }
      }
    }

    const points = [...bucketMap.entries()].map(([date, v]) => {
      const day = new Date(`${date}T12:00:00`).getDay();
      return {
        key: period === '7d' ? DAY_KEYS[day] : date,
        date,
        total: v.total,
        new: v.new,
        returning: v.returning,
      };
    });

    const total = points.reduce((s, p) => s + p.total, 0);
    const averagePerDay = points.length ? Math.round((total / points.length) * 10) / 10 : 0;
    const best = points.reduce(
      (max, p) => (p.total > max.total ? p : max),
      points[0] ?? { key: 'mon', total: 0 },
    );

    const prevStart = subDays(start, days);
    const prevLinks = await this.prisma.patientClinic.count({
      where: {
        clinicId,
        OR: [
          { createdAt: { gte: prevStart, lt: start } },
          { lastVisitAt: { gte: prevStart, lt: start } },
        ],
      },
    });
    const changePercent =
      prevLinks > 0
        ? Math.round(((total - prevLinks) / prevLinks) * 1000) / 10
        : total > 0
          ? 100
          : 0;

    return {
      period,
      total,
      averagePerDay,
      changePercent,
      bestDayKey: best.key,
      points,
    };
  }

  async getRevenueSeries(clinicId: string, period: PatientFlowPeriod = '7d') {
    const days =
      period === '7d'
        ? 7
        : period === '30d'
          ? 30
          : period === '3m'
            ? 90
            : 365;
    const end = endOfDay(new Date());
    const start = startOfDay(subDays(end, days - 1));

    const [payments, expenses] = await Promise.all([
      this.prisma.payment.findMany({
        where: {
          clinicId,
          status: 'PAID',
          paidAt: { gte: start, lte: end },
        },
        select: { amountUzs: true, paidAt: true },
      }),
      this.prisma.expense.findMany({
        where: {
          clinicId,
          date: { gte: start, lte: end },
        },
        select: { amountUzs: true, date: true },
      }),
    ]);

    const bucket = new Map<
      string,
      { date: string; revenue: number; expenses: number; profit: number }
    >();
    for (let i = 0; i < days; i++) {
      const d = addDays(start, i);
      const key = format(d, 'yyyy-MM-dd');
      bucket.set(key, { date: key, revenue: 0, expenses: 0, profit: 0 });
    }

    for (const p of payments) {
      if (!p.paidAt) continue;
      const key = format(p.paidAt, 'yyyy-MM-dd');
      const b = bucket.get(key);
      if (b) b.revenue += p.amountUzs;
    }
    for (const e of expenses) {
      const key = format(e.date, 'yyyy-MM-dd');
      const b = bucket.get(key);
      if (b) b.expenses += e.amountUzs;
    }

    const points = [...bucket.values()].map((p) => ({
      ...p,
      profit: p.revenue - p.expenses,
    }));
    const total = points.reduce((s, p) => s + p.revenue, 0);
    const prevStart = subDays(start, days);
    const prevPayments = await this.prisma.payment.aggregate({
      where: {
        clinicId,
        status: 'PAID',
        paidAt: { gte: prevStart, lt: start },
      },
      _sum: { amountUzs: true },
    });
    const prevTotal = prevPayments._sum.amountUzs ?? 0;
    const changePercent =
      prevTotal > 0
        ? Math.round(((total - prevTotal) / prevTotal) * 1000) / 10
        : total > 0
          ? 100
          : 0;

    return { total, changePercent, period, points };
  }

  assertClinic(clinicId?: string | null): string {
    if (!clinicId) {
      throw new AppError('UNAUTHORIZED', 'No clinic context', 401);
    }
    return clinicId;
  }
}
