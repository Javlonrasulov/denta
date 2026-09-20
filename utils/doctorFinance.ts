import type { FinanceRecord, PaymentStatus } from '@/types';
import { DEMO_DOCTOR_ID, localDateKey } from '@/utils/doctorDashboard';

export type FinancePeriod = 'today' | 'week' | 'month' | 'year';
export type FinanceTypeFilter = 'all' | 'income' | 'expense';
export type FinanceStatusFilter = 'all' | PaymentStatus;

export type FinanceTrendPoint = {
  key: string;
  value: number;
  date?: string;
  hour?: number;
};

export type ServiceBreakdownItem = {
  name: string;
  amount: number;
  share: number;
  count: number;
};

export type DoctorFinanceInsights = {
  topService: string | null;
  averageCheck: number;
  patientsCount: number;
  revenuePerPatient: number;
};

export type DoctorFinanceModel = {
  period: FinancePeriod;
  todayRevenue: number;
  todayExpenses: number;
  todayNet: number;
  revenue: number;
  expenses: number;
  netIncome: number;
  pendingAmount: number;
  pendingCount: number;
  previousRevenue: number;
  deltaPct: number | null;
  trend: FinanceTrendPoint[];
  services: ServiceBreakdownItem[];
  insights: DoctorFinanceInsights;
  transactions: FinanceRecord[];
};

const LOCALE_MAP: Record<string, string> = {
  uz: 'uz-Latn-UZ',
  'uz-Cyrl': 'uz-Cyrl-UZ',
  ru: 'ru-RU',
  en: 'en-GB',
};

export const DEMO_DOCTOR_NAME = 'Dr. Alisher Aliyev';

function startOfDay(date: Date): Date {
  const x = new Date(date);
  x.setHours(0, 0, 0, 0);
  return x;
}

function parseRecordDate(dateStr: string): Date {
  return startOfDay(new Date(`${dateStr.slice(0, 10)}T00:00:00`));
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function periodFrom(period: FinancePeriod, today: Date): Date {
  const from = new Date(today);
  switch (period) {
    case 'today':
      break;
    case 'week':
      from.setDate(from.getDate() - 6);
      break;
    case 'month':
      from.setMonth(from.getMonth() - 1);
      break;
    case 'year':
      from.setFullYear(from.getFullYear() - 1);
      break;
  }
  return from;
}

function previousWindow(
  period: FinancePeriod,
  from: Date,
  today: Date,
): { from: Date; to: Date } {
  const length = today.getTime() - from.getTime();
  const prevTo = addDays(from, -1);
  const prevFrom = new Date(prevTo.getTime() - length);
  if (period === 'today') {
    const yesterday = addDays(today, -1);
    return { from: yesterday, to: yesterday };
  }
  return { from: startOfDay(prevFrom), to: prevTo };
}

export function isOutstandingStatus(status: PaymentStatus): boolean {
  return status === 'pending' || status === 'overdue' || status === 'partial';
}

export function isCancelledStatus(status: PaymentStatus): boolean {
  return status === 'cancelled';
}

function countsAsRevenue(record: FinanceRecord): boolean {
  return record.type === 'income' && !isCancelledStatus(record.paymentStatus);
}

function countsAsExpense(record: FinanceRecord): boolean {
  return record.type === 'expense' && !isCancelledStatus(record.paymentStatus);
}

export function scopeDoctorFinance(
  records: FinanceRecord[],
  doctorName = DEMO_DOCTOR_NAME,
  doctorId = DEMO_DOCTOR_ID,
): FinanceRecord[] {
  return records.filter((record) => {
    if (record.doctorId) return record.doctorId === doctorId;
    if (record.doctorName) return record.doctorName === doctorName;
    return false;
  });
}

export function filterRecordsByPeriod(
  records: FinanceRecord[],
  period: FinancePeriod,
  now = new Date(),
): FinanceRecord[] {
  const today = startOfDay(now);
  const from = periodFrom(period, today);
  return records.filter((record) => {
    const date = parseRecordDate(record.date);
    return date >= from && date <= today;
  });
}

export function queryFinance(
  records: FinanceRecord[],
  type: FinanceTypeFilter,
  status: FinanceStatusFilter,
): FinanceRecord[] {
  return records.filter((record) => {
    if (type !== 'all' && record.type !== type) return false;
    if (status !== 'all' && record.paymentStatus !== status) return false;
    return true;
  });
}

function sumAmount(records: FinanceRecord[]): number {
  return records.reduce((sum, record) => sum + record.amount, 0);
}

function hourOf(record: FinanceRecord): number {
  if (!record.time) return 12;
  const hour = Number(record.time.slice(0, 2));
  return Number.isFinite(hour) ? hour : 12;
}

function buildTrend(
  records: FinanceRecord[],
  period: FinancePeriod,
  now: Date,
): FinanceTrendPoint[] {
  const income = records.filter(countsAsRevenue);
  const today = startOfDay(now);

  if (period === 'today') {
    const buckets = [9, 11, 13, 15, 17];
    return buckets.map((hour) => ({
      key: String(hour),
      hour,
      value: sumAmount(
        income.filter((record) => {
          const h = hourOf(record);
          return h >= hour && h < hour + 2;
        }),
      ),
    }));
  }

  if (period === 'week') {
    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(today, index - 6);
      const key = localDateKey(date);
      return {
        key,
        date: key,
        value: sumAmount(income.filter((record) => record.date === key)),
      };
    });
  }

  if (period === 'month') {
    return Array.from({ length: 6 }, (_, index) => {
      const endOffset = (5 - index) * -5;
      const end = addDays(today, endOffset);
      const start = addDays(end, -4);
      const startKey = localDateKey(start);
      const endKey = localDateKey(end);
      return {
        key: `${startKey}:${endKey}`,
        date: endKey,
        value: sumAmount(
          income.filter((record) => {
            const date = parseRecordDate(record.date);
            return date >= startOfDay(start) && date <= startOfDay(end);
          }),
        ),
      };
    });
  }

  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(today);
    date.setMonth(date.getMonth() - (11 - index));
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const key = `${year}-${month}`;
    return {
      key,
      date: `${key}-01`,
      value: sumAmount(income.filter((record) => record.date.startsWith(key))),
    };
  });
}

function buildServices(income: FinanceRecord[]): ServiceBreakdownItem[] {
  const map = new Map<string, { amount: number; count: number }>();
  income.forEach((record) => {
    const current = map.get(record.serviceName) ?? { amount: 0, count: 0 };
    current.amount += record.amount;
    current.count += 1;
    map.set(record.serviceName, current);
  });
  const total = Array.from(map.values()).reduce((sum, item) => sum + item.amount, 0) || 1;
  return Array.from(map.entries())
    .map(([name, item]) => ({
      name,
      amount: item.amount,
      count: item.count,
      share: item.amount / total,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function formatFinanceDate(iso?: string | null, locale = 'uz'): string {
  if (!iso) return '';
  const intlLocale = LOCALE_MAP[locale] ?? 'uz-Latn-UZ';
  try {
    const date = new Date(`${iso.slice(0, 10)}T12:00:00`);
    if (Number.isNaN(date.getTime())) return iso;
    const parts = new Intl.DateTimeFormat(intlLocale, {
      day: 'numeric',
      month: 'short',
    }).formatToParts(date);
    const day = parts.find((part) => part.type === 'day')?.value ?? '';
    const month = parts.find((part) => part.type === 'month')?.value ?? '';
    const cap = month ? month.charAt(0).toUpperCase() + month.slice(1).replace('.', '') : '';
    return `${day} ${cap}`.trim();
  } catch {
    return iso;
  }
}

export function formatTrendLabel(
  point: FinanceTrendPoint,
  period: FinancePeriod,
  locale = 'uz',
): string {
  const intlLocale = LOCALE_MAP[locale] ?? 'uz-Latn-UZ';
  if (period === 'today' && point.hour != null) {
    return `${String(point.hour).padStart(2, '0')}`;
  }
  if (!point.date) return point.key;
  const date = new Date(`${point.date.slice(0, 10)}T12:00:00`);
  if (period === 'year') {
    return new Intl.DateTimeFormat(intlLocale, { month: 'short' })
      .format(date)
      .replace('.', '')
      .slice(0, 3);
  }
  if (period === 'week') {
    return new Intl.DateTimeFormat(intlLocale, { weekday: 'short' })
      .format(date)
      .replace('.', '')
      .slice(0, 2);
  }
  return String(date.getDate());
}

export function sortFinance(records: FinanceRecord[]): FinanceRecord[] {
  return [...records].sort((a, b) => {
    const date = b.date.localeCompare(a.date);
    if (date !== 0) return date;
    return (b.time ?? '00:00').localeCompare(a.time ?? '00:00');
  });
}

export function buildDoctorFinanceModel(
  records: FinanceRecord[],
  period: FinancePeriod,
  now = new Date(),
): DoctorFinanceModel {
  const todayKey = localDateKey(now);
  const todayRecords = records.filter((record) => record.date === todayKey);
  const periodRecords = filterRecordsByPeriod(records, period, now);
  const today = startOfDay(now);
  const from = periodFrom(period, today);
  const previous = previousWindow(period, from, today);
  const previousRecords = records.filter((record) => {
    const date = parseRecordDate(record.date);
    return date >= previous.from && date <= previous.to;
  });

  const todayIncome = todayRecords.filter(countsAsRevenue);
  const todayExpense = todayRecords.filter(countsAsExpense);
  const income = periodRecords.filter(countsAsRevenue);
  const expenses = periodRecords.filter(countsAsExpense);
  const outstanding = periodRecords.filter(
    (record) => record.type === 'income' && isOutstandingStatus(record.paymentStatus),
  );
  const previousIncome = previousRecords.filter(countsAsRevenue);

  const todayRevenue = sumAmount(todayIncome);
  const todayExpenses = sumAmount(todayExpense);
  const revenue = sumAmount(income);
  const expenseTotal = sumAmount(expenses);
  const previousRevenue = sumAmount(previousIncome);
  const rawDelta =
    previousRevenue > 0
      ? Math.round(((revenue - previousRevenue) / previousRevenue) * 100)
      : null;
  const deltaPct =
    rawDelta == null || Math.abs(rawDelta) > 300 ? null : rawDelta;

  const services = buildServices(income);
  const patients = new Set(
    income.map((record) => record.patientName).filter((name): name is string => Boolean(name)),
  );

  return {
    period,
    todayRevenue,
    todayExpenses,
    todayNet: todayRevenue - todayExpenses,
    revenue,
    expenses: expenseTotal,
    netIncome: revenue - expenseTotal,
    pendingAmount: sumAmount(outstanding),
    pendingCount: outstanding.length,
    previousRevenue,
    deltaPct,
    trend: buildTrend(periodRecords, period, now),
    services,
    insights: {
      topService: services[0]?.name ?? null,
      averageCheck: income.length ? Math.round(revenue / income.length) : 0,
      patientsCount: patients.size,
      revenuePerPatient: patients.size ? Math.round(revenue / patients.size) : 0,
    },
    transactions: sortFinance(periodRecords),
  };
}
