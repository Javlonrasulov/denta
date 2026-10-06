/** Calendar-date helpers on `yyyy-MM-dd` strings (UTC-based, no time-of-day, no DST). */
export type Ymd = string;

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isYmd(value: unknown): value is Ymd {
  if (typeof value !== 'string' || !YMD_RE.test(value)) return false;
  const d = toUtcDate(value);
  return !Number.isNaN(d.getTime()) && fromUtcDate(d) === value;
}

export function toUtcDate(ymd: Ymd): Date {
  return new Date(`${ymd}T00:00:00.000Z`);
}

export function fromUtcDate(d: Date): Ymd {
  return d.toISOString().slice(0, 10);
}

export function addDays(ymd: Ymd, days: number): Ymd {
  const d = toUtcDate(ymd);
  d.setUTCDate(d.getUTCDate() + days);
  return fromUtcDate(d);
}

/** Whole days from `a` to `b` (b − a). */
export function diffDays(a: Ymd, b: Ymd): number {
  return Math.round((toUtcDate(b).getTime() - toUtcDate(a).getTime()) / 86_400_000);
}

/** 0=Sun … 6=Sat */
export function dayOfWeek(ymd: Ymd): number {
  return toUtcDate(ymd).getUTCDay();
}

export function daysInMonth(year: number, month1: number): number {
  return new Date(Date.UTC(year, month1, 0)).getUTCDate();
}

export function ymd(year: number, month1: number, day: number): Ymd {
  return `${year}-${String(month1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function parts(value: Ymd): { y: number; m: number; d: number } {
  const [y, m, d] = value.split('-').map(Number);
  return { y, m, d };
}

export function startOfMonth(value: Ymd): Ymd {
  const { y, m } = parts(value);
  return ymd(y, m, 1);
}

export function endOfMonth(value: Ymd): Ymd {
  const { y, m } = parts(value);
  return ymd(y, m, daysInMonth(y, m));
}

/** Same day-of-month `months` later; clamps to the last day when the month is shorter. */
export function addMonthsClamped(value: Ymd, months: number, anchorDay?: number): Ymd {
  const { y, m, d } = parts(value);
  const total = y * 12 + (m - 1) + months;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return ymd(ny, nm, Math.min(anchorDay ?? d, daysInMonth(ny, nm)));
}

/** Monday of the ISO week containing `value`. */
export function startOfWeekMonday(value: Ymd): Ymd {
  return addDays(value, -((dayOfWeek(value) + 6) % 7));
}

export function maxYmd(a: Ymd, b: Ymd): Ymd {
  return a >= b ? a : b;
}

export function minYmd(a: Ymd, b: Ymd): Ymd {
  return a <= b ? a : b;
}

/** Calendar date of `instant` in an IANA time zone. */
export function zonedYmd(instant: Date, timeZone: string): Ymd {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(instant);
}

export function zonedHour(instant: Date, timeZone: string): number {
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', hourCycle: 'h23' });
  return Number(fmt.format(instant));
}
