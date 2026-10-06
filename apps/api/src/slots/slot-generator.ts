/**
 * Server-side available slot generation.
 * Mirrors (and replaces) client `utils/slots.ts` business logic.
 *
 * Final availability = clinic hours ∩ doctor schedule − clinic lunch
 *   − doctor break − existing appointment intervals.
 */

export type ScheduleWindow = {
  start: string; // HH:mm
  end: string;
};

export type BreakWindow = {
  start: string;
  end: string;
};

export type ExistingBooking = {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  /** Booking end (HH:mm). Without it the booking is assumed to last one slot. */
  endTime?: string;
  status: string;
};

export type TimeSlotDto = {
  time: string;
  available: boolean;
};

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function fromMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function overlapsBreak(
  slotStart: number,
  slotEnd: number,
  brk?: BreakWindow | null,
): boolean {
  if (!brk?.start || !brk?.end) return false;
  const bStart = toMinutes(brk.start);
  const bEnd = toMinutes(brk.end);
  return slotStart < bEnd && slotEnd > bStart;
}

const INACTIVE_STATUSES = new Set(['CANCELLED', 'cancelled', 'NO_SHOW']);

/**
 * Generate slots for a doctor on a calendar date.
 * Cancelled bookings do not block the slot. Slots overlapping clinic lunch
 * are omitted entirely; slots after lunch restart at the lunch end.
 */
export function generateTimeSlots(input: {
  workingHours: ScheduleWindow;
  breakTime?: BreakWindow | null;
  clinicHours?: ScheduleWindow | null;
  clinicLunch?: BreakWindow | null;
  durationMinutes: number;
  date: string;
  bookings: ExistingBooking[];
}): TimeSlotDto[] {
  const duration = Math.max(5, input.durationMinutes || 30);
  let start = toMinutes(input.workingHours.start);
  let end = toMinutes(input.workingHours.end);
  if (input.clinicHours) {
    start = Math.max(start, toMinutes(input.clinicHours.start));
    end = Math.min(end, toMinutes(input.clinicHours.end));
  }
  if (start >= end) return [];

  const busy = input.bookings
    .filter((b) => b.date === input.date && !INACTIVE_STATUSES.has(b.status))
    .map((b) => {
      const s = toMinutes(b.time);
      const e = b.endTime ? toMinutes(b.endTime) : s + duration;
      return { s, e: e > s ? e : s + duration };
    });

  const segments: Array<[number, number]> = [];
  const lunch = input.clinicLunch;
  if (lunch?.start && lunch?.end && toMinutes(lunch.start) < toMinutes(lunch.end)) {
    const ls = toMinutes(lunch.start);
    const le = toMinutes(lunch.end);
    if (ls > start) segments.push([start, Math.min(ls, end)]);
    if (le < end) segments.push([Math.max(le, start), end]);
  } else {
    segments.push([start, end]);
  }

  const slots: TimeSlotDto[] = [];
  for (const [segStart, segEnd] of segments) {
    for (let t = segStart; t + duration <= segEnd; t += duration) {
      const slotEnd = t + duration;
      const inBreak = overlapsBreak(t, slotEnd, input.breakTime);
      const taken = busy.some((b) => t < b.e && slotEnd > b.s);
      slots.push({ time: fromMinutes(t), available: !inBreak && !taken });
    }
  }
  return slots;
}
