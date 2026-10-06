'use client';

import { useEffect, useState } from 'react';

import type {
  DoctorAgreement,
  DoctorFinanceModel,
  DoctorRentRowStatus,
  RentDailyBasis,
  RentIntervalUnit,
  RentObligationStatus,
  RentPaymentMethod,
  RentRecurrence,
  SaveAgreementBody,
} from '@/lib/api/clinic-api';
import { readPersistedSession } from '@/lib/auth/session';

import { addDays, diffDays, isYmd } from './dates';
import { planObligations, type PlannedObligation } from './rent-schedule';

/** Int4 money columns in the API. */
export const MAX_UZS = 2_000_000_000;
/** Same window as MAX_BACKDATE_DAYS in the API. */
export const MAX_START_OFFSET_DAYS = 366;

export const FINANCE_PERMS = {
  read: 'doctor_finance:read',
  payment: 'doctor_finance:payment',
  manage: 'doctor_finance:manage',
  agreement: 'doctor_finance:agreement',
} as const;

export type DoctorFinanceAccess = Record<keyof typeof FINANCE_PERMS, boolean>;

/** UI hints only; the API enforces the same permissions on every request. */
export function useDoctorFinanceAccess(): DoctorFinanceAccess {
  const [access, setAccess] = useState<DoctorFinanceAccess>({
    read: false,
    payment: false,
    manage: false,
    agreement: false,
  });
  useEffect(() => {
    const perms = readPersistedSession()?.activeWorkspace?.permissions;
    const has = (p: string) => !perms || perms.includes('*') || perms.includes(p);
    setAccess({
      read: has(FINANCE_PERMS.read),
      payment: has(FINANCE_PERMS.read) && has(FINANCE_PERMS.payment),
      manage: has(FINANCE_PERMS.read) && has(FINANCE_PERMS.manage),
      agreement: has(FINANCE_PERMS.read) && has(FINANCE_PERMS.agreement),
    });
  }, []);
  return access;
}

export function todayLocalYmd(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 100 − p computed in basis points, so 64.1 → 35.9 (not 35.900000000000006). */
export function complementPercent(p: number): number {
  return (10_000 - Math.round(p * 100)) / 100;
}

export function groupDigits(digits: string | number): string {
  return String(digits).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function digitsOnly(raw: string, max = 10): string {
  return raw.replace(/\D/g, '').replace(/^0+/, '').slice(0, max);
}

// ─── Agreement form ───────────────────────────────────────────────────────────

export type PriorMode = 'none' | 'paid' | 'debt';

export type AgreementForm = {
  model: DoctorFinanceModel | null;
  effectiveFrom: string;
  clinicPercent: string;
  /** Only meaningful for CUSTOM; DOCTOR_REVENUE_PLUS_RENT always has rent. */
  customRent: boolean;
  amount: string;
  recurrence: RentRecurrence;
  dueDayOfMonth: number;
  dueDayOfWeek: number;
  dailyBasis: RentDailyBasis;
  intervalValue: string;
  intervalUnit: RentIntervalUnit;
  oneTimeDueDate: string;
  graceDays: string;
  prorateFirstPeriod: boolean;
  scheduleItems: { dueDate: string; amount: string }[];
  notes: string;
  prior: PriorMode;
  priorAmount: string;
  priorPaidAt: string;
  priorCoveredFrom: string;
  priorCoveredTo: string;
  priorMethod: RentPaymentMethod;
  debtAmount: string;
  debtNote: string;
};

export function emptyAgreementForm(today = todayLocalYmd()): AgreementForm {
  return {
    model: null,
    effectiveFrom: today,
    clinicPercent: '50',
    customRent: false,
    amount: '',
    recurrence: 'MONTHLY',
    dueDayOfMonth: 5,
    dueDayOfWeek: 1,
    dailyBasis: 'WORKING_DAYS',
    intervalValue: '2',
    intervalUnit: 'WEEK',
    oneTimeDueDate: today,
    graceDays: '0',
    prorateFirstPeriod: true,
    scheduleItems: [{ dueDate: today, amount: '' }],
    notes: '',
    prior: 'none',
    priorAmount: '',
    priorPaidAt: today,
    priorCoveredFrom: '',
    priorCoveredTo: '',
    priorMethod: 'cash',
    debtAmount: '',
    debtNote: '',
  };
}

/** Prefills a new version from the current agreement; balances are never copied. */
export function formFromAgreement(a: DoctorAgreement, today = todayLocalYmd()): AgreementForm {
  const f = emptyAgreementForm(today);
  if (a.effectiveFrom > today) f.effectiveFrom = a.effectiveFrom;
  f.model = a.model;
  f.clinicPercent = String(a.clinicPercent);
  f.notes = a.notes ?? '';
  if (a.rent) {
    f.customRent = true;
    f.amount = a.rent.amountUzs ? String(a.rent.amountUzs) : '';
    f.recurrence = a.rent.recurrence;
    f.dueDayOfMonth = a.rent.dueDayOfMonth ?? f.dueDayOfMonth;
    f.dueDayOfWeek = a.rent.dueDayOfWeek ?? f.dueDayOfWeek;
    f.dailyBasis = a.rent.dailyBasis ?? f.dailyBasis;
    f.intervalValue = a.rent.intervalValue ? String(a.rent.intervalValue) : f.intervalValue;
    f.intervalUnit = a.rent.intervalUnit ?? f.intervalUnit;
    f.oneTimeDueDate = a.rent.oneTimeDueDate ?? f.oneTimeDueDate;
    f.graceDays = String(a.rent.graceDays ?? 0);
    f.prorateFirstPeriod = a.rent.prorateFirstPeriod;
    if (a.rent.scheduleItems.length) {
      f.scheduleItems = a.rent.scheduleItems
        .filter((s) => s.dueDate >= today)
        .map((s) => ({ dueDate: s.dueDate, amount: String(s.amountUzs) }));
      if (!f.scheduleItems.length) f.scheduleItems = [{ dueDate: today, amount: '' }];
    }
  }
  return f;
}

export function hasRent(form: AgreementForm): boolean {
  return (
    form.model === 'DOCTOR_REVENUE_PLUS_RENT' || (form.model === 'CUSTOM' && form.customRent)
  );
}

export function hasShare(form: AgreementForm): boolean {
  return form.model === 'REVENUE_SHARE' || form.model === 'CUSTOM';
}

export type AgreementErrors = Partial<
  Record<
    | 'model'
    | 'effectiveFrom'
    | 'clinicPercent'
    | 'amount'
    | 'intervalValue'
    | 'oneTimeDueDate'
    | 'graceDays'
    | 'scheduleItems'
    | 'priorAmount'
    | 'priorPaidAt'
    | 'priorCovered'
    | 'debtAmount',
    string
  >
>;

/** Returns i18n keys (relative to crm.doctor_finance.errors). */
export function validateAgreementForm(
  form: AgreementForm,
  today: string,
  minEffectiveFrom?: string,
): AgreementErrors {
  const e: AgreementErrors = {};
  if (!form.model) e.model = 'model';
  if (!isYmd(form.effectiveFrom)) e.effectiveFrom = 'date';
  else if (Math.abs(diffDays(form.effectiveFrom, today)) > MAX_START_OFFSET_DAYS) {
    e.effectiveFrom = 'start_range';
  } else if (minEffectiveFrom && form.effectiveFrom < minEffectiveFrom) {
    e.effectiveFrom = 'api.version_before';
  }
  if (hasShare(form)) {
    const raw = form.clinicPercent.trim().replace(',', '.');
    const p = Number(raw);
    if (raw === '' || !Number.isFinite(p) || p < 0 || p > 100) {
      e.clinicPercent = 'percent';
    } else if (!/^\d+(\.\d{1,2})?$/.test(raw)) {
      e.clinicPercent = 'percent_precision';
    } else if (form.model === 'CUSTOM' && !form.customRent && p === 100) {
      e.clinicPercent = 'custom_empty';
    }
  }
  if (hasRent(form)) {
    const amount = Number(form.amount || 0);
    if (form.recurrence !== 'CUSTOM_SCHEDULE') {
      if (amount <= 0) e.amount = 'amount';
      else if (amount > MAX_UZS) e.amount = 'amount_max';
    }
    if (form.recurrence === 'INTERVAL') {
      const n = Number(form.intervalValue);
      if (!Number.isInteger(n) || n < 1 || n > 365) e.intervalValue = 'interval';
    }
    if (form.recurrence === 'ONE_TIME') {
      if (!isYmd(form.oneTimeDueDate) || form.oneTimeDueDate < form.effectiveFrom) {
        e.oneTimeDueDate = 'due_before_start';
      }
    }
    if (form.recurrence === 'CUSTOM_SCHEDULE') {
      const items = form.scheduleItems.filter((s) => s.dueDate || s.amount);
      const dates = new Set<string>();
      if (!items.length) e.scheduleItems = 'schedule_empty';
      for (const s of items) {
        const a = Number(s.amount || 0);
        if (!isYmd(s.dueDate) || s.dueDate < form.effectiveFrom) e.scheduleItems = 'schedule_date';
        else if (dates.has(s.dueDate)) e.scheduleItems = 'schedule_duplicate';
        else if (a <= 0 || a > MAX_UZS) e.scheduleItems = 'schedule_amount';
        dates.add(s.dueDate);
      }
    }
    const grace = Number(form.graceDays || 0);
    if (!Number.isInteger(grace) || grace < 0 || grace > 60) e.graceDays = 'grace';
  }
  if (form.prior === 'paid') {
    const a = Number(form.priorAmount || 0);
    if (a <= 0 || a > MAX_UZS) e.priorAmount = 'amount';
    if (!isYmd(form.priorPaidAt) || form.priorPaidAt > today) e.priorPaidAt = 'date_future';
    if (
      form.priorCoveredFrom &&
      form.priorCoveredTo &&
      form.priorCoveredTo < form.priorCoveredFrom
    ) {
      e.priorCovered = 'range';
    }
  }
  if (form.prior === 'debt') {
    const a = Number(form.debtAmount || 0);
    if (a <= 0 || a > MAX_UZS) e.debtAmount = 'amount';
  }
  return e;
}

export function agreementBodyFromForm(form: AgreementForm): SaveAgreementBody {
  const body: SaveAgreementBody = {
    model: form.model!,
    effectiveFrom: form.effectiveFrom,
    notes: form.notes.trim() || undefined,
  };
  if (hasShare(form)) body.clinicPercent = Number(form.clinicPercent.replace(',', '.'));
  if (hasRent(form)) {
    const base = { recurrence: form.recurrence, graceDays: Number(form.graceDays || 0) };
    const amountUzs = Number(form.amount || 0);
    switch (form.recurrence) {
      case 'MONTHLY':
        body.rent = {
          ...base,
          amountUzs,
          dueDayOfMonth: form.dueDayOfMonth,
          prorateFirstPeriod: form.prorateFirstPeriod,
        };
        break;
      case 'WEEKLY':
        body.rent = {
          ...base,
          amountUzs,
          dueDayOfWeek: form.dueDayOfWeek,
          prorateFirstPeriod: form.prorateFirstPeriod,
        };
        break;
      case 'DAILY':
        body.rent = { ...base, amountUzs, dailyBasis: form.dailyBasis };
        break;
      case 'INTERVAL':
        body.rent = {
          ...base,
          amountUzs,
          intervalValue: Number(form.intervalValue),
          intervalUnit: form.intervalUnit,
        };
        break;
      case 'ONE_TIME':
        body.rent = { ...base, amountUzs, oneTimeDueDate: form.oneTimeDueDate };
        break;
      case 'CUSTOM_SCHEDULE':
        body.rent = {
          ...base,
          scheduleItems: form.scheduleItems
            .filter((s) => s.dueDate && s.amount)
            .map((s) => ({ dueDate: s.dueDate, amountUzs: Number(s.amount) })),
        };
        break;
    }
  }
  if (form.prior === 'paid') {
    body.priorPayment = {
      amountUzs: Number(form.priorAmount),
      paidAt: form.priorPaidAt,
      coveredFrom: form.priorCoveredFrom || undefined,
      coveredTo: form.priorCoveredTo || undefined,
      method: form.priorMethod,
    };
  }
  if (form.prior === 'debt') {
    body.openingBalance = {
      amountUzs: Number(form.debtAmount),
      note: form.debtNote.trim() || undefined,
    };
  }
  return body;
}

/** First few obligations the agreement would create (client-side preview, same rules as the API). */
export function previewObligations(
  form: AgreementForm,
  workingDays: number[] | undefined,
  count = 3,
): PlannedObligation[] {
  if (!hasRent(form) || !isYmd(form.effectiveFrom)) return [];
  const body = agreementBodyFromForm(form);
  const rent = body.rent;
  if (!rent) return [];
  const horizon = rent.recurrence === 'DAILY' ? 21 : rent.recurrence === 'WEEKLY' ? 35 : 800;
  const plan = planObligations(
    {
      agreementId: 'preview',
      effectiveFrom: form.effectiveFrom,
      effectiveTo: null,
      amountUzs: rent.amountUzs ?? 0,
      recurrence: rent.recurrence,
      intervalValue: rent.intervalValue,
      intervalUnit: rent.intervalUnit,
      dueDayOfWeek: rent.dueDayOfWeek,
      dueDayOfMonth: rent.dueDayOfMonth,
      dailyBasis: rent.dailyBasis,
      oneTimeDueDate: rent.oneTimeDueDate,
      prorateFirstPeriod: rent.prorateFirstPeriod ?? true,
      scheduleItems: rent.scheduleItems?.map((s, i) => ({ id: String(i), ...s })),
    },
    { until: addDays(form.effectiveFrom, horizon), workingDays },
  );
  return plan.slice(0, count);
}

// ─── Display helpers ──────────────────────────────────────────────────────────

type T = (key: string, opts?: Record<string, unknown>) => string;

export function weekdayLabel(t: T, day: number): string {
  return t(`crm.doctor_finance.weekdays.${day}`);
}

/** "3 000 000 so'm · har oyning 5-sanasi" style one-liner. */
export function rentRuleSummary(
  t: T,
  money: (n: number) => string,
  rule: {
    recurrence: RentRecurrence | null;
    amountUzs?: number | null;
    rentAmountUzs?: number | null;
    dueDayOfMonth?: number | null;
    dueDayOfWeek?: number | null;
    intervalValue?: number | null;
    intervalUnit?: RentIntervalUnit | null;
    dailyBasis?: RentDailyBasis | null;
    oneTimeDueDate?: string | null;
  },
): string {
  const amount = rule.amountUzs ?? rule.rentAmountUzs ?? 0;
  const p = 'crm.doctor_finance.rule';
  let when = '';
  switch (rule.recurrence) {
    case 'MONTHLY':
      when = t(`${p}.monthly`, { day: rule.dueDayOfMonth ?? 1 });
      break;
    case 'WEEKLY':
      when = t(`${p}.weekly`, { day: weekdayLabel(t, rule.dueDayOfWeek ?? 1) });
      break;
    case 'DAILY':
      when = t(rule.dailyBasis === 'CALENDAR_DAYS' ? `${p}.daily_calendar` : `${p}.daily_working`);
      break;
    case 'INTERVAL':
      when = t(`${p}.interval_${(rule.intervalUnit ?? 'MONTH').toLowerCase()}`, {
        count: rule.intervalValue ?? 1,
      });
      break;
    case 'ONE_TIME':
      when = t(`${p}.one_time`);
      break;
    case 'CUSTOM_SCHEDULE':
      return t(`${p}.custom_schedule`);
    default:
      return '—';
  }
  return `${money(amount)} · ${when}`;
}

export function modelLabel(t: T, model: DoctorFinanceModel | null | undefined): string {
  return model ? t(`crm.doctor_finance.models.${model}.title`) : t('crm.doctor_finance.not_configured');
}

export const ROW_STATUS_TONE: Record<DoctorRentRowStatus, string> = {
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  pending: 'bg-sky-50 text-sky-700 ring-sky-600/15',
  debtor: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  overdue: 'bg-rose-50 text-rose-700 ring-rose-600/15',
  not_configured: 'bg-slate-100 text-slate-600 ring-slate-500/15',
};

export const OBLIGATION_TONE: Record<RentObligationStatus, string> = {
  UPCOMING: 'bg-sky-50 text-sky-700 ring-sky-600/15',
  DUE: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  PARTIALLY_PAID: 'bg-violet-50 text-violet-700 ring-violet-600/15',
  PAID: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  OVERDUE: 'bg-rose-50 text-rose-700 ring-rose-600/15',
  CANCELLED: 'bg-slate-100 text-slate-500 ring-slate-500/15',
};

/**
 * Localized text for an API failure. Server messages are English and only
 * used to pick a translation; they are never shown to the user as-is.
 */
export function financeErrorText(t: T, err: unknown): string {
  const e = (err ?? {}) as { status?: number; code?: string; message?: string };
  const msg = e.message ?? '';
  const p = 'crm.doctor_finance.errors';
  if (e.code === 'DOCTOR_INACTIVE') return t(`${p}.doctor_inactive`);
  if (e.code === 'INVALID_FILE') return t(`${p}.api.file_type`);
  if (e.code === 'VALIDATION_ERROR') {
    if (/in the future/i.test(msg)) return t(`${p}.date_future`);
    if (/too old/i.test(msg)) return t(`${p}.api.too_old`);
    if (/attachment/i.test(msg)) return t(`${p}.api.attachment`);
    if (/before the current/i.test(msg)) return t(`${p}.api.version_before`);
    if (/unknown service/i.test(msg)) return t(`${p}.api.unknown_service`);
    if (/invalid range|range too long/i.test(msg)) return t(`${p}.range`);
    return t(`${p}.api.validation`);
  }
  if (e.status === 403) return t(`${p}.api.forbidden`);
  if (e.status === 404) return t(`${p}.api.not_found`);
  if (e.status === 409) return t(`${p}.api.conflict`);
  if (err instanceof TypeError) return t(`${p}.api.network`);
  return t(`${p}.generic`);
}

/** Maps API validation `details.field` to a form key. */
export function formFieldFromApi(field: string | undefined): keyof AgreementErrors | null {
  if (!field) return null;
  if (field === 'effectiveFrom') return 'effectiveFrom';
  if (field === 'clinicPercent' || field === 'model') return 'clinicPercent';
  if (field === 'rent.amountUzs' || field === 'rent') return 'amount';
  if (field.startsWith('rent.scheduleItems')) return 'scheduleItems';
  if (field === 'rent.oneTimeDueDate') return 'oneTimeDueDate';
  if (field.startsWith('rent.interval')) return 'intervalValue';
  if (field.startsWith('priorPayment')) return 'priorPaidAt';
  if (field.startsWith('openingBalance')) return 'debtAmount';
  return null;
}
