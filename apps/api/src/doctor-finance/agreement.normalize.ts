import { AppError } from '../common/filters/global-exception.filter';
import { addDays, diffDays, isYmd, type Ymd } from './engine/dates';
import { FULL_SHARE_BP, percentToBp } from './engine/ledger';
import type { RentRule } from './engine/rent-schedule';
import type { AgreementInputDto } from './dto/doctor-finance.dto';

export type NormalizedAgreement = {
  model: AgreementInputDto['model'];
  effectiveFrom: Ymd;
  clinicShareBp: number;
  rentEnabled: boolean;
  rentAmountUzs: number | null;
  recurrence: RentRule['recurrence'] | null;
  intervalValue: number | null;
  intervalUnit: 'DAY' | 'WEEK' | 'MONTH' | null;
  dueDayOfWeek: number | null;
  dueDayOfMonth: number | null;
  dailyBasis: 'CALENDAR_DAYS' | 'WORKING_DAYS' | null;
  oneTimeDueDate: Ymd | null;
  graceDays: number;
  prorateFirstPeriod: boolean;
  scheduleItems: { dueDate: Ymd; amountUzs: number; note: string | null }[];
  serviceRules: { serviceId: string; clinicShareBp: number }[];
  notes: string | null;
};

/** Maximum distance of effectiveFrom from today (keeps backfills bounded). */
export const MAX_BACKDATE_DAYS = 366;

function fail(field: string, message: string, extra: Record<string, unknown> = {}): never {
  throw new AppError('VALIDATION_ERROR', message, 400, { field, ...extra });
}

/** Turns API input into exact agreement columns; rejects contradictory combinations. */
export function normalizeAgreement(dto: AgreementInputDto, today: Ymd): NormalizedAgreement {
  if (!isYmd(dto.effectiveFrom)) fail('effectiveFrom', 'Invalid date');
  const lag = diffDays(dto.effectiveFrom, today);
  if (lag > MAX_BACKDATE_DAYS || -lag > MAX_BACKDATE_DAYS) {
    fail('effectiveFrom', 'effectiveFrom is too far from today', { maxDays: MAX_BACKDATE_DAYS });
  }

  let clinicShareBp: number;
  let rentRequired = false;
  let rentAllowed = false;
  switch (dto.model) {
    case 'CLINIC_REVENUE':
      clinicShareBp = FULL_SHARE_BP;
      break;
    case 'DOCTOR_REVENUE_PLUS_RENT':
      clinicShareBp = 0;
      rentRequired = true;
      rentAllowed = true;
      break;
    case 'REVENUE_SHARE':
      if (dto.clinicPercent == null) fail('clinicPercent', 'clinicPercent is required');
      clinicShareBp = percentToBp(dto.clinicPercent);
      break;
    case 'CUSTOM':
      if (dto.clinicPercent == null) fail('clinicPercent', 'clinicPercent is required');
      clinicShareBp = percentToBp(dto.clinicPercent);
      rentAllowed = true;
      break;
    default:
      fail('model', 'Unknown model');
  }
  if (clinicShareBp < 0 || clinicShareBp > FULL_SHARE_BP) fail('clinicPercent', 'Out of range');

  const rent = dto.rent;
  if (rentRequired && !rent) fail('rent', 'Rent terms are required for this model');
  if (rent && !rentAllowed) fail('rent', 'This model does not use rent');
  if (dto.model === 'CUSTOM' && !rent && clinicShareBp === FULL_SHARE_BP) {
    fail('model', 'Custom agreement needs rent or a doctor share');
  }

  const out: NormalizedAgreement = {
    model: dto.model,
    effectiveFrom: dto.effectiveFrom,
    clinicShareBp,
    rentEnabled: Boolean(rent),
    rentAmountUzs: null,
    recurrence: null,
    intervalValue: null,
    intervalUnit: null,
    dueDayOfWeek: null,
    dueDayOfMonth: null,
    dailyBasis: null,
    oneTimeDueDate: null,
    graceDays: 0,
    prorateFirstPeriod: true,
    scheduleItems: [],
    serviceRules: [],
    notes: dto.notes?.trim() || null,
  };

  if (rent) {
    out.recurrence = rent.recurrence;
    out.graceDays = rent.graceDays ?? 0;
    out.prorateFirstPeriod = rent.prorateFirstPeriod ?? true;
    if (rent.recurrence !== 'CUSTOM_SCHEDULE') {
      if (!rent.amountUzs) fail('rent.amountUzs', 'Rent amount is required');
      out.rentAmountUzs = rent.amountUzs;
    }
    switch (rent.recurrence) {
      case 'DAILY':
        if (!rent.dailyBasis) fail('rent.dailyBasis', 'Choose working days or calendar days');
        out.dailyBasis = rent.dailyBasis;
        break;
      case 'WEEKLY':
        if (rent.dueDayOfWeek == null) fail('rent.dueDayOfWeek', 'Choose the weekday');
        out.dueDayOfWeek = rent.dueDayOfWeek;
        break;
      case 'MONTHLY':
        if (rent.dueDayOfMonth == null) fail('rent.dueDayOfMonth', 'Choose the day of month');
        out.dueDayOfMonth = rent.dueDayOfMonth;
        break;
      case 'INTERVAL':
        if (!rent.intervalValue) fail('rent.intervalValue', 'Interval is required');
        if (!rent.intervalUnit) fail('rent.intervalUnit', 'Interval unit is required');
        out.intervalValue = rent.intervalValue;
        out.intervalUnit = rent.intervalUnit;
        break;
      case 'ONE_TIME': {
        const due = rent.oneTimeDueDate ?? dto.effectiveFrom;
        if (!isYmd(due) || due < dto.effectiveFrom) {
          fail('rent.oneTimeDueDate', 'Due date must be on or after the start date');
        }
        out.oneTimeDueDate = due;
        break;
      }
      case 'CUSTOM_SCHEDULE': {
        const items = rent.scheduleItems ?? [];
        if (!items.length) fail('rent.scheduleItems', 'Add at least one payment date');
        const seen = new Set<string>();
        for (const [i, item] of items.entries()) {
          if (!isYmd(item.dueDate) || item.dueDate < dto.effectiveFrom) {
            fail(`rent.scheduleItems.${i}.dueDate`, 'Date must be on or after the start date');
          }
          if (seen.has(item.dueDate)) fail(`rent.scheduleItems.${i}.dueDate`, 'Duplicate date');
          if (item.dueDate > addDays(dto.effectiveFrom, 3 * 366)) {
            fail(`rent.scheduleItems.${i}.dueDate`, 'Date is too far in the future');
          }
          seen.add(item.dueDate);
        }
        out.scheduleItems = [...items]
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
          .map((it) => ({ dueDate: it.dueDate, amountUzs: it.amountUzs, note: it.note?.trim() || null }));
        out.rentAmountUzs = out.scheduleItems[0].amountUzs;
        break;
      }
    }
  }

  if (dto.serviceRules?.length) {
    if (dto.model !== 'REVENUE_SHARE' && dto.model !== 'CUSTOM') {
      fail('serviceRules', 'Service overrides apply only to share-based agreements');
    }
    const seen = new Set<string>();
    out.serviceRules = dto.serviceRules.map((r, i) => {
      if (seen.has(r.serviceId)) fail(`serviceRules.${i}.serviceId`, 'Duplicate service');
      seen.add(r.serviceId);
      return { serviceId: r.serviceId, clinicShareBp: percentToBp(r.clinicPercent) };
    });
  }
  return out;
}

export function ruleFromAgreement(a: {
  id: string;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  rentAmountUzs: number | null;
  recurrence: RentRule['recurrence'] | null;
  intervalValue: number | null;
  intervalUnit: 'DAY' | 'WEEK' | 'MONTH' | null;
  dueDayOfWeek: number | null;
  dueDayOfMonth: number | null;
  dailyBasis: 'CALENDAR_DAYS' | 'WORKING_DAYS' | null;
  oneTimeDueDate: Date | null;
  prorateFirstPeriod: boolean;
  scheduleItems?: { id: string; dueDate: Date; amountUzs: number }[];
}): RentRule | null {
  if (!a.recurrence) return null;
  const ymd = (d: Date) => d.toISOString().slice(0, 10);
  return {
    agreementId: a.id,
    effectiveFrom: ymd(a.effectiveFrom),
    effectiveTo: a.effectiveTo ? ymd(a.effectiveTo) : null,
    amountUzs: a.rentAmountUzs ?? 0,
    recurrence: a.recurrence,
    intervalValue: a.intervalValue,
    intervalUnit: a.intervalUnit,
    dueDayOfWeek: a.dueDayOfWeek,
    dueDayOfMonth: a.dueDayOfMonth,
    dailyBasis: a.dailyBasis,
    oneTimeDueDate: a.oneTimeDueDate ? ymd(a.oneTimeDueDate) : null,
    prorateFirstPeriod: a.prorateFirstPeriod,
    scheduleItems: a.scheduleItems?.map((s) => ({ id: s.id, dueDate: ymd(s.dueDate), amountUzs: s.amountUzs })),
  };
}
