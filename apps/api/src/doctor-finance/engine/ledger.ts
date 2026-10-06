import { addDays, diffDays, type Ymd } from './dates';

export type ObligationStatus =
  | 'UPCOMING'
  | 'DUE'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED';

/**
 * Status rules:
 * - CANCELLED wins; PAID when fully covered.
 * - Before the due date: UPCOMING (or PARTIALLY_PAID).
 * - From the due date through the grace period: DUE (or PARTIALLY_PAID).
 * - After due date + grace days with a balance: OVERDUE (even when partially paid).
 */
export function obligationStatus(
  o: { amountUzs: number; paidUzs: number; dueDate: Ymd; cancelled: boolean },
  today: Ymd,
  graceDays = 0,
): ObligationStatus {
  if (o.cancelled) return 'CANCELLED';
  if (o.paidUzs >= o.amountUzs) return 'PAID';
  if (today > addDays(o.dueDate, Math.max(0, graceDays))) return 'OVERDUE';
  if (o.paidUzs > 0) return 'PARTIALLY_PAID';
  return today < o.dueDate ? 'UPCOMING' : 'DUE';
}

export type CreditSource = { paymentId: string; available: number };
export type OpenObligation = { id: string; outstanding: number; dueDate: Ymd; createdAt?: number };
export type AllocationPlan = { paymentId: string; obligationId: string; amountUzs: number };

/**
 * FIFO allocation: oldest payment credit → oldest due obligation (overdue first by date).
 * Whatever credit is left is the doctor's advance and applies automatically to
 * obligations generated later.
 */
export function planAllocations(credits: CreditSource[], obligations: OpenObligation[]): AllocationPlan[] {
  const queue = obligations
    .filter((o) => o.outstanding > 0)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || (a.createdAt ?? 0) - (b.createdAt ?? 0))
    .map((o) => ({ ...o }));
  const plan: AllocationPlan[] = [];
  let idx = 0;
  for (const credit of credits) {
    let left = credit.available;
    while (left > 0 && idx < queue.length) {
      const target = queue[idx];
      const amount = Math.min(left, target.outstanding);
      plan.push({ paymentId: credit.paymentId, obligationId: target.id, amountUzs: amount });
      left -= amount;
      target.outstanding -= amount;
      if (target.outstanding === 0) idx++;
    }
    if (idx >= queue.length) break;
  }
  return plan;
}

export const FULL_SHARE_BP = 10_000;

/** Splits a signed amount; the doctor share is rounded half-up, the clinic gets the exact remainder. */
export function splitShare(amountUzs: number, clinicShareBp: number): { clinic: number; doctor: number } {
  const bp = Math.min(FULL_SHARE_BP, Math.max(0, Math.round(clinicShareBp)));
  const sign = amountUzs < 0 ? -1 : 1;
  const abs = Math.abs(amountUzs);
  const doctorAbs = Math.floor((abs * (FULL_SHARE_BP - bp) * 2 + FULL_SHARE_BP) / (FULL_SHARE_BP * 2));
  const doctor = sign * doctorAbs;
  return { clinic: amountUzs - doctor, doctor: doctor === 0 ? 0 : doctor };
}

export function percentToBp(percent: number): number {
  return Math.round(percent * 100);
}

export type ReminderSettings = {
  remind3Days: boolean;
  remind1Day: boolean;
  remindDueDay: boolean;
  remindOverdue: boolean;
  overdueFrequency: 'DAILY' | 'EVERY_3_DAYS' | 'WEEKLY' | 'CUSTOM';
  overdueCustomDays?: number | null;
};

export function overdueEveryDays(s: ReminderSettings): number {
  switch (s.overdueFrequency) {
    case 'DAILY':
      return 1;
    case 'WEEKLY':
      return 7;
    case 'CUSTOM':
      return Math.max(1, s.overdueCustomDays ?? 3);
    default:
      return 3;
  }
}

/**
 * Which reminder (if any) is due today for an obligation. The returned key is the dedupe
 * key: the same key is never sent twice to the same recipient.
 */
export function reminderKeyFor(
  o: { dueDate: Ymd; outstanding: number; cancelled: boolean },
  today: Ymd,
  settings: ReminderSettings,
  graceDays = 0,
): { key: string; kind: 'D3' | 'D1' | 'DUE' | 'OVERDUE'; daysOverdue: number } | null {
  if (o.cancelled || o.outstanding <= 0) return null;
  const until = diffDays(today, o.dueDate);
  if (until === 3 && settings.remind3Days) return { key: 'D3', kind: 'D3', daysOverdue: 0 };
  if (until === 1 && settings.remind1Day) return { key: 'D1', kind: 'D1', daysOverdue: 0 };
  if (until === 0 && settings.remindDueDay) return { key: 'DUE', kind: 'DUE', daysOverdue: 0 };
  const overdueFrom = addDays(o.dueDate, Math.max(0, graceDays));
  const daysOver = diffDays(overdueFrom, today);
  if (daysOver >= 1 && settings.remindOverdue && (daysOver - 1) % overdueEveryDays(settings) === 0) {
    return { key: `OD:${today}`, kind: 'OVERDUE', daysOverdue: diffDays(o.dueDate, today) };
  }
  return null;
}

export type AgingBuckets = { d0_7: number; d8_30: number; d31_60: number; d60_plus: number };

/** Outstanding amounts by days past due (only obligations already due). */
export function agingBuckets(
  items: { dueDate: Ymd; outstanding: number; cancelled?: boolean }[],
  today: Ymd,
): AgingBuckets {
  const b: AgingBuckets = { d0_7: 0, d8_30: 0, d31_60: 0, d60_plus: 0 };
  for (const it of items) {
    if (it.cancelled || it.outstanding <= 0 || it.dueDate > today) continue;
    const d = diffDays(it.dueDate, today);
    if (d <= 7) b.d0_7 += it.outstanding;
    else if (d <= 30) b.d8_30 += it.outstanding;
    else if (d <= 60) b.d31_60 += it.outstanding;
    else b.d60_plus += it.outstanding;
  }
  return b;
}
