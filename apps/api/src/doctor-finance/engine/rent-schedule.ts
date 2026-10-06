import {
  addDays,
  addMonthsClamped,
  dayOfWeek,
  daysInMonth,
  diffDays,
  endOfMonth,
  maxYmd,
  minYmd,
  parts,
  startOfMonth,
  startOfWeekMonday,
  ymd,
  type Ymd,
} from './dates';

export type Recurrence =
  | 'DAILY'
  | 'WEEKLY'
  | 'MONTHLY'
  | 'INTERVAL'
  | 'CUSTOM_SCHEDULE'
  | 'ONE_TIME';

export type RentRule = {
  agreementId: string;
  effectiveFrom: Ymd;
  /** Inclusive; null = open-ended. */
  effectiveTo: Ymd | null;
  amountUzs: number;
  recurrence: Recurrence;
  intervalValue?: number | null;
  intervalUnit?: 'DAY' | 'WEEK' | 'MONTH' | null;
  /** 0=Sun … 6=Sat */
  dueDayOfWeek?: number | null;
  /** 1..31, clamped to the month's last day. */
  dueDayOfMonth?: number | null;
  dailyBasis?: 'CALENDAR_DAYS' | 'WORKING_DAYS' | null;
  oneTimeDueDate?: Ymd | null;
  prorateFirstPeriod: boolean;
  scheduleItems?: { id: string; dueDate: Ymd; amountUzs: number }[];
};

export type GenerateContext = {
  /** Only periods with dueDate <= until are produced (lookahead horizon). */
  until: Ymd;
  /** Last day already billed by earlier agreement versions; nothing is billed twice. */
  coveredUntil?: Ymd | null;
  /** Doctor's working weekdays (0=Sun) for DAILY + WORKING_DAYS. */
  workingDays?: number[];
  /** Specific dates the doctor does not work (vacation / day off). */
  daysOff?: Ymd[];
};

export type PlannedObligation = {
  periodKey: string;
  periodStart: Ymd;
  periodEnd: Ymd;
  dueDate: Ymd;
  amountUzs: number;
  prorated: boolean;
};

type Candidate = { start: Ymd; end: Ymd; due: Ymd; amount: number };

const MAX_ITERATIONS = 5000;

/** Integer proration, rounded half-up to whole so'm. */
export function prorate(amount: number, coveredDays: number, fullDays: number): number {
  if (coveredDays >= fullDays) return amount;
  return Math.floor((amount * coveredDays * 2 + fullDays) / (fullDays * 2));
}

function* calendarCandidates(rule: RentRule): Generator<Candidate> {
  const from = rule.effectiveFrom;
  switch (rule.recurrence) {
    case 'MONTHLY': {
      const day = rule.dueDayOfMonth ?? 1;
      let cursor = startOfMonth(from);
      for (let i = 0; i < MAX_ITERATIONS; i++) {
        const { y, m } = parts(cursor);
        yield {
          start: cursor,
          end: endOfMonth(cursor),
          due: ymd(y, m, Math.min(day, daysInMonth(y, m))),
          amount: rule.amountUzs,
        };
        cursor = addMonthsClamped(cursor, 1, 1);
      }
      return;
    }
    case 'WEEKLY': {
      const offset = ((rule.dueDayOfWeek ?? 1) + 6) % 7;
      let cursor = startOfWeekMonday(from);
      for (let i = 0; i < MAX_ITERATIONS; i++) {
        yield { start: cursor, end: addDays(cursor, 6), due: addDays(cursor, offset), amount: rule.amountUzs };
        cursor = addDays(cursor, 7);
      }
      return;
    }
    case 'INTERVAL': {
      const n = Math.max(1, rule.intervalValue ?? 1);
      const unit = rule.intervalUnit ?? 'MONTH';
      const anchorDay = parts(from).d;
      const at = (k: number): Ymd =>
        unit === 'MONTH'
          ? addMonthsClamped(from, k * n, anchorDay)
          : addDays(from, k * n * (unit === 'WEEK' ? 7 : 1));
      for (let k = 0; k < MAX_ITERATIONS; k++) {
        const start = at(k);
        yield { start, end: addDays(at(k + 1), -1), due: start, amount: rule.amountUzs };
      }
      return;
    }
    default:
      return;
  }
}

/**
 * Deterministic list of obligations an agreement implies up to `ctx.until`.
 * Period keys are stable, so regeneration is idempotent (DB has a unique key on them).
 */
export function planObligations(rule: RentRule, ctx: GenerateContext): PlannedObligation[] {
  if (!(rule.amountUzs > 0) && rule.recurrence !== 'CUSTOM_SCHEDULE') return [];
  const windowStart = ctx.coveredUntil
    ? maxYmd(rule.effectiveFrom, addDays(ctx.coveredUntil, 1))
    : rule.effectiveFrom;
  const windowEnd = rule.effectiveTo;
  if (windowEnd && windowEnd < windowStart) return [];
  const out: PlannedObligation[] = [];
  const key = (suffix: string) => `${rule.agreementId}:${suffix}`;

  if (rule.recurrence === 'ONE_TIME') {
    const due = rule.oneTimeDueDate ?? rule.effectiveFrom;
    if (due < windowStart || (windowEnd && due > windowEnd) || due > ctx.until) return [];
    return [
      {
        periodKey: key('once'),
        periodStart: minYmd(rule.effectiveFrom, due),
        periodEnd: due,
        dueDate: due,
        amountUzs: rule.amountUzs,
        prorated: false,
      },
    ];
  }

  if (rule.recurrence === 'CUSTOM_SCHEDULE') {
    const items = [...(rule.scheduleItems ?? [])].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    let prev = addDays(rule.effectiveFrom, -1);
    for (const item of items) {
      const start = addDays(prev, 1);
      prev = item.dueDate;
      if (item.dueDate < windowStart || item.amountUzs <= 0) continue;
      if (windowEnd && item.dueDate > windowEnd) break;
      if (item.dueDate > ctx.until) break;
      out.push({
        periodKey: key(`item:${item.id}`),
        periodStart: maxYmd(start, windowStart),
        periodEnd: item.dueDate,
        dueDate: item.dueDate,
        amountUzs: item.amountUzs,
        prorated: false,
      });
    }
    return out;
  }

  if (rule.recurrence === 'DAILY') {
    const working = rule.dailyBasis === 'WORKING_DAYS' ? new Set(ctx.workingDays ?? []) : null;
    const off = new Set(ctx.daysOff ?? []);
    const last = windowEnd ? minYmd(windowEnd, ctx.until) : ctx.until;
    let day = windowStart;
    for (let i = 0; i < MAX_ITERATIONS && day <= last; i++, day = addDays(day, 1)) {
      if (working && (!working.has(dayOfWeek(day)) || off.has(day))) continue;
      out.push({
        periodKey: key(day),
        periodStart: day,
        periodEnd: day,
        dueDate: day,
        amountUzs: rule.amountUzs,
        prorated: false,
      });
    }
    return out;
  }

  for (const c of calendarCandidates(rule)) {
    if (c.end < windowStart) continue;
    if (windowEnd && c.start > windowEnd) break;
    const start = maxYmd(c.start, windowStart);
    const end = windowEnd ? minYmd(c.end, windowEnd) : c.end;
    const partial = start !== c.start || end !== c.end;
    const due = minYmd(maxYmd(c.due, start), end);
    if (due > ctx.until) break;
    const fullDays = diffDays(c.start, c.end) + 1;
    const coveredDays = diffDays(start, end) + 1;
    out.push({
      periodKey: key(c.start),
      periodStart: start,
      periodEnd: end,
      dueDate: due,
      amountUzs: partial && rule.prorateFirstPeriod ? prorate(c.amount, coveredDays, fullDays) : c.amount,
      prorated: partial && rule.prorateFirstPeriod,
    });
  }
  return out.filter((o) => o.amountUzs > 0);
}

/** First due date strictly after `after` that this rule would bill (ignores the horizon). */
export function nextDueAfter(rule: RentRule, after: Ymd, ctx: Omit<GenerateContext, 'until'> = {}): Ymd | null {
  const n = Math.max(1, rule.intervalValue ?? 1);
  const unitDays = rule.intervalUnit === 'DAY' ? 1 : rule.intervalUnit === 'WEEK' ? 7 : 31;
  const lastFixed =
    rule.recurrence === 'ONE_TIME'
      ? rule.oneTimeDueDate ?? after
      : rule.recurrence === 'CUSTOM_SCHEDULE'
        ? (rule.scheduleItems ?? []).reduce<Ymd>((m, s) => maxYmd(m, s.dueDate), after)
        : after;
  const start = maxYmd(after, maxYmd(rule.effectiveFrom, ctx.coveredUntil ?? after));
  const span =
    rule.recurrence === 'INTERVAL'
      ? 2 * n * unitDays
      : rule.recurrence === 'DAILY' || rule.recurrence === 'WEEKLY'
        ? 31
        : 800;
  const horizon = Math.max(400, diffDays(after, start) + span, diffDays(after, lastFixed));
  const plan = planObligations(rule, { ...ctx, until: addDays(after, horizon) });
  return plan.find((p) => p.dueDate > after)?.dueDate ?? null;
}
