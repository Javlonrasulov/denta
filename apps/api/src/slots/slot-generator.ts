/**
 * Server-side available slot generation.
 * Mirrors (and replaces) client `utils/slots.ts` business logic.
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

/**
 * Generate slots for a doctor on a calendar date.
 * Cancelled bookings do not block the slot.
 */
export function generateTimeSlots(input: {
  workingHours: ScheduleWindow;
  breakTime?: BreakWindow | null;
  durationMinutes: number;
  date: string;
  bookings: ExistingBooking[];
}): TimeSlotDto[] {
  const duration = Math.max(5, input.durationMinutes || 30);
  const start = toMinutes(input.workingHours.start);
  const end = toMinutes(input.workingHours.end);
  const taken = new Set(
    input.bookings
      .filter(
        (b) =>
          b.date === input.date &&
          b.status !== 'CANCELLED' &&
          b.status !== 'cancelled' &&
          b.status !== 'NO_SHOW',
      )
      .map((b) => b.time),
  );

  const slots: TimeSlotDto[] = [];
  for (let t = start; t + duration <= end; t += duration) {
    const time = fromMinutes(t);
    const slotEnd = t + duration;
    const inBreak = overlapsBreak(t, slotEnd, input.breakTime);
    slots.push({
      time,
      available: !inBreak && !taken.has(time),
    });
  }
  return slots;
}
