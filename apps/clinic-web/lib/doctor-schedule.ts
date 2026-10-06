import type { DoctorScheduleDay } from '@/lib/api/clinic-api';

/** Monday-first display order; values are JS weekdays (0=Sun … 6=Sat). */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export const SLOT_OPTIONS = [15, 20, 30, 40, 45, 60, 90] as const;
export const DEFAULT_SLOT = 30;
export const MIN_SLOT = 5;
export const MAX_SLOT = 180;

export type DayState = {
  enabled: boolean;
  start: string;
  end: string;
  lunch: boolean;
  breakStart: string;
  breakEnd: string;
};

export type WeekState = Record<number, DayState>;

export type DayError = 'range' | 'lunch';

const WORK_DAY: DayState = {
  enabled: true,
  start: '09:00',
  end: '18:00',
  lunch: true,
  breakStart: '13:00',
  breakEnd: '14:00',
};

export function toMinutes(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}

export function buildWeek(enabledDays: number[], day: Partial<DayState> = {}): WeekState {
  const week: WeekState = {};
  for (const d of WEEK_ORDER) {
    week[d] = { ...WORK_DAY, ...day, enabled: enabledDays.includes(d) };
  }
  return week;
}

export function defaultWeek(): WeekState {
  return buildWeek([1, 2, 3, 4, 5, 6]);
}

export const PRESETS = {
  weekdays: () => buildWeek([1, 2, 3, 4, 5]),
  six_days: () => buildWeek([1, 2, 3, 4, 5, 6]),
  everyday: () => buildWeek([0, 1, 2, 3, 4, 5, 6], { start: '09:00', end: '21:00' }),
} as const;

export type PresetKey = keyof typeof PRESETS;

export function weekFromSchedule(schedule: DoctorScheduleDay[]): WeekState {
  if (!schedule.length) return defaultWeek();
  const week = buildWeek([]);
  for (const s of schedule) {
    week[s.dayOfWeek] = {
      enabled: true,
      start: s.startTime,
      end: s.endTime,
      lunch: Boolean(s.breakStart && s.breakEnd),
      breakStart: s.breakStart ?? WORK_DAY.breakStart,
      breakEnd: s.breakEnd ?? WORK_DAY.breakEnd,
    };
  }
  return week;
}

export function scheduleFromWeek(week: WeekState): DoctorScheduleDay[] {
  return WEEK_ORDER.filter((d) => week[d].enabled).map((d) => {
    const day = week[d];
    return {
      dayOfWeek: d,
      startTime: day.start,
      endTime: day.end,
      breakStart: day.lunch ? day.breakStart : null,
      breakEnd: day.lunch ? day.breakEnd : null,
    };
  });
}

export function validateWeek(week: WeekState): Partial<Record<number, DayError>> {
  const errors: Partial<Record<number, DayError>> = {};
  for (const d of WEEK_ORDER) {
    const day = week[d];
    if (!day.enabled) continue;
    const start = toMinutes(day.start);
    const end = toMinutes(day.end);
    if (start >= end) {
      errors[d] = 'range';
      continue;
    }
    if (day.lunch) {
      const bs = toMinutes(day.breakStart);
      const be = toMinutes(day.breakEnd);
      if (bs >= be || bs < start || be > end) errors[d] = 'lunch';
    }
  }
  return errors;
}

/** Working minutes per week, lunch excluded. */
export function weeklyMinutes(schedule: DoctorScheduleDay[]): number {
  return schedule.reduce((sum, s) => {
    const lunch =
      s.breakStart && s.breakEnd ? toMinutes(s.breakEnd) - toMinutes(s.breakStart) : 0;
    return sum + Math.max(0, toMinutes(s.endTime) - toMinutes(s.startTime) - lunch);
  }, 0);
}

function workSegments(day: DoctorScheduleDay): [number, number][] {
  const start = toMinutes(day.startTime);
  const end = toMinutes(day.endTime);
  if (!day.breakStart || !day.breakEnd) return [[start, end]];
  return [
    [start, toMinutes(day.breakStart)],
    [toMinutes(day.breakEnd), end],
  ];
}

/** Bookable start times for one day, the same grid the patient app shows. */
export function slotTimes(day: DoctorScheduleDay, slotMinutes: number): string[] {
  const out: string[] = [];
  for (const [from, to] of workSegments(day)) {
    for (let t = from; t + slotMinutes <= to; t += slotMinutes) {
      out.push(`${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`);
    }
  }
  return out;
}

export function capacity(schedule: DoctorScheduleDay[], slotMinutes: number) {
  const perDay = schedule.map((d) => slotTimes(d, slotMinutes).length);
  return {
    min: perDay.length ? Math.min(...perDay) : 0,
    max: perDay.length ? Math.max(...perDay) : 0,
    week: perDay.reduce((a, b) => a + b, 0),
  };
}

export type ScheduleGroup = { days: number[]; start: string; end: string };

/** Groups consecutive (Monday-first) days with identical hours: "Du–Sha 09:00–18:00". */
export function groupSchedule(schedule: DoctorScheduleDay[]): ScheduleGroup[] {
  const byDay = new Map(schedule.map((s) => [s.dayOfWeek, s]));
  const groups: ScheduleGroup[] = [];
  for (const d of WEEK_ORDER) {
    const s = byDay.get(d);
    if (!s) continue;
    const last = groups[groups.length - 1];
    const prevDay = last?.days[last.days.length - 1];
    const adjacent =
      prevDay !== undefined && WEEK_ORDER.indexOf(d as (typeof WEEK_ORDER)[number]) ===
        WEEK_ORDER.indexOf(prevDay as (typeof WEEK_ORDER)[number]) + 1;
    if (last && adjacent && last.start === s.startTime && last.end === s.endTime) {
      last.days.push(d);
    } else {
      groups.push({ days: [d], start: s.startTime, end: s.endTime });
    }
  }
  return groups;
}

export function formatGroupDays(days: number[], short: (d: number) => string): string {
  if (days.length === 1) return short(days[0]);
  if (days.length === 2) return `${short(days[0])}, ${short(days[1])}`;
  return `${short(days[0])}–${short(days[days.length - 1])}`;
}

export type ScheduleConflict = {
  dayOfWeek: number;
  clinicName: string;
  start: string;
  end: string;
};

/** Days where the new schedule overlaps hours the doctor already works elsewhere. */
export function findConflicts(
  schedule: DoctorScheduleDay[],
  busy: { clinicName: string; schedule: DoctorScheduleDay[] }[],
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];
  for (const mine of schedule) {
    for (const other of busy) {
      const theirs = other.schedule.find((s) => s.dayOfWeek === mine.dayOfWeek);
      if (!theirs) continue;
      const overlap =
        toMinutes(mine.startTime) < toMinutes(theirs.endTime) &&
        toMinutes(theirs.startTime) < toMinutes(mine.endTime);
      if (overlap) {
        conflicts.push({
          dayOfWeek: mine.dayOfWeek,
          clinicName: other.clinicName,
          start: theirs.startTime,
          end: theirs.endTime,
        });
      }
    }
  }
  return conflicts;
}

export function timeOptions(stepMinutes = 15): string[] {
  const out: string[] = [];
  for (let m = 0; m < 24 * 60; m += stepMinutes) {
    out.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
  }
  return out;
}
