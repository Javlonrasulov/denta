/**
 * Clinic weekly hours stored in `ClinicBranch.workingHours` (JSON).
 * Lunch fields are optional so legacy rows read as `lunchEnabled = false`.
 */
export type ClinicWorkingDay = {
  day: number;
  open: string;
  close: string;
  closed?: boolean;
  lunchEnabled?: boolean;
  lunchStart?: string;
  lunchEnd?: string;
};

export type ClinicDayRule =
  | { kind: 'unconfigured' }
  | { kind: 'closed' }
  | {
      kind: 'open';
      hours: { start: string; end: string };
      lunch: { start: string; end: string } | null;
    };

export type ClinicHoursIssue = {
  day: number;
  field: 'hours' | 'lunch' | 'day';
  code:
    | 'INVALID_TIME'
    | 'HOURS_ORDER'
    | 'LUNCH_ORDER'
    | 'LUNCH_OUTSIDE_HOURS'
    | 'DUPLICATE_DAY';
};

export type IntervalVerdict = 'ok' | 'closed' | 'outside_hours' | 'lunch';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isTime(value: unknown): value is string {
  return typeof value === 'string' && TIME_RE.test(value);
}

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function parseClinicWorkingHours(raw: unknown): ClinicWorkingDay[] | null {
  if (!Array.isArray(raw)) return null;
  const days: ClinicWorkingDay[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;
    const day = Number(r.day);
    if (!Number.isInteger(day) || day < 0 || day > 6) continue;
    if (!isTime(r.open) || !isTime(r.close)) continue;
    const lunchEnabled =
      r.lunchEnabled === true && isTime(r.lunchStart) && isTime(r.lunchEnd);
    days.push({
      day,
      open: r.open,
      close: r.close,
      closed: r.closed === true,
      lunchEnabled,
      ...(isTime(r.lunchStart) ? { lunchStart: r.lunchStart } : {}),
      ...(isTime(r.lunchEnd) ? { lunchEnd: r.lunchEnd } : {}),
    });
  }
  return days;
}

export function validateClinicWorkingHours(
  days: ClinicWorkingDay[],
): ClinicHoursIssue[] {
  const issues: ClinicHoursIssue[] = [];
  const seen = new Set<number>();
  for (const d of days) {
    if (seen.has(d.day)) {
      issues.push({ day: d.day, field: 'day', code: 'DUPLICATE_DAY' });
      continue;
    }
    seen.add(d.day);
    if (d.closed) continue;
    if (!isTime(d.open) || !isTime(d.close)) {
      issues.push({ day: d.day, field: 'hours', code: 'INVALID_TIME' });
      continue;
    }
    const open = toMinutes(d.open);
    const close = toMinutes(d.close);
    if (open >= close) {
      issues.push({ day: d.day, field: 'hours', code: 'HOURS_ORDER' });
      continue;
    }
    if (!d.lunchEnabled) continue;
    if (!isTime(d.lunchStart) || !isTime(d.lunchEnd)) {
      issues.push({ day: d.day, field: 'lunch', code: 'INVALID_TIME' });
      continue;
    }
    const ls = toMinutes(d.lunchStart);
    const le = toMinutes(d.lunchEnd);
    if (ls >= le) {
      issues.push({ day: d.day, field: 'lunch', code: 'LUNCH_ORDER' });
    } else if (ls < open || le > close || (ls === open && le === close)) {
      issues.push({ day: d.day, field: 'lunch', code: 'LUNCH_OUTSIDE_HOURS' });
    }
  }
  return issues;
}

/** Strip lunch values when disabled so stored JSON stays canonical. */
export function normalizeClinicWorkingHours(
  days: ClinicWorkingDay[],
): ClinicWorkingDay[] {
  return [...days]
    .sort((a, b) => a.day - b.day)
    .map((d) => ({
      day: d.day,
      open: d.open,
      close: d.close,
      closed: Boolean(d.closed),
      lunchEnabled: Boolean(d.lunchEnabled && !d.closed),
      ...(d.lunchEnabled && !d.closed
        ? { lunchStart: d.lunchStart, lunchEnd: d.lunchEnd }
        : {}),
    }));
}

/**
 * Missing JSON means the clinic never configured hours, so booking stays
 * governed by doctor schedules alone. A configured array without the day
 * means closed (same rule the marketplace "open now" badge uses).
 */
export function clinicDayRule(raw: unknown, localDay: number): ClinicDayRule {
  const days = parseClinicWorkingHours(raw);
  if (!days || days.length === 0) return { kind: 'unconfigured' };
  const entry = days.find((d) => d.day === localDay);
  if (!entry || entry.closed) return { kind: 'closed' };
  if (toMinutes(entry.open) >= toMinutes(entry.close)) return { kind: 'closed' };
  return {
    kind: 'open',
    hours: { start: entry.open, end: entry.close },
    lunch:
      entry.lunchEnabled && entry.lunchStart && entry.lunchEnd
        ? { start: entry.lunchStart, end: entry.lunchEnd }
        : null,
  };
}

/** Interval in clinic-local minutes from midnight, `[start, end)`. */
export function checkIntervalAgainstClinic(
  rule: ClinicDayRule,
  startMin: number,
  endMin: number,
): IntervalVerdict {
  if (rule.kind === 'unconfigured') return 'ok';
  if (rule.kind === 'closed') return 'closed';
  if (startMin < toMinutes(rule.hours.start) || endMin > toMinutes(rule.hours.end)) {
    return 'outside_hours';
  }
  if (rule.lunch) {
    const ls = toMinutes(rule.lunch.start);
    const le = toMinutes(rule.lunch.end);
    if (startMin < le && endMin > ls) return 'lunch';
  }
  return 'ok';
}
