import { AppError } from '../common/filters/global-exception.filter';

/** One working day of a doctor in a clinic. Days missing from a schedule are days off. */
export type ScheduleDay = {
  dayOfWeek: number; // 0=Sun … 6=Sat
  startTime: string; // HH:mm
  endTime: string;
  breakStart: string | null;
  breakEnd: string | null;
};

export type ScheduleDayInput = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breakStart?: string | null;
  breakEnd?: string | null;
};

export const DEFAULT_SLOT_MINUTES = 30;

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

function minutes(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}

function invalid(dayOfWeek: number, message: string): never {
  throw new AppError('INVALID_SCHEDULE', message, 400, { dayOfWeek });
}

/** Validates and sorts a weekly schedule; throws INVALID_SCHEDULE with the offending day. */
export function normalizeSchedule(entries: ScheduleDayInput[]): ScheduleDay[] {
  const seen = new Set<number>();
  const days = entries.map((e) => {
    if (!Number.isInteger(e.dayOfWeek) || e.dayOfWeek < 0 || e.dayOfWeek > 6) {
      invalid(e.dayOfWeek, 'dayOfWeek must be 0..6');
    }
    if (seen.has(e.dayOfWeek)) invalid(e.dayOfWeek, 'Duplicate day');
    seen.add(e.dayOfWeek);

    if (!HHMM.test(e.startTime) || !HHMM.test(e.endTime)) {
      invalid(e.dayOfWeek, 'Time must be HH:mm');
    }
    if (minutes(e.startTime) >= minutes(e.endTime)) {
      invalid(e.dayOfWeek, 'Start must be before end');
    }

    const breakStart = e.breakStart?.trim() || null;
    const breakEnd = e.breakEnd?.trim() || null;
    if (breakStart || breakEnd) {
      if (!breakStart || !breakEnd || !HHMM.test(breakStart) || !HHMM.test(breakEnd)) {
        invalid(e.dayOfWeek, 'Break needs start and end in HH:mm');
      }
      if (
        minutes(breakStart) >= minutes(breakEnd) ||
        minutes(breakStart) < minutes(e.startTime) ||
        minutes(breakEnd) > minutes(e.endTime)
      ) {
        invalid(e.dayOfWeek, 'Break must be inside working hours');
      }
    }

    return {
      dayOfWeek: e.dayOfWeek,
      startTime: e.startTime,
      endTime: e.endTime,
      breakStart,
      breakEnd,
    };
  });
  return days.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
}
