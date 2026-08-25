import { Appointment, Doctor, TimeSlot } from '@/types';

function parseTime(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Builds booking slots from doctor working hours, break, duration, and booked appointments.
 * This logic is frontend-first and designed to move to NestJS later.
 */
export function generateTimeSlots(
  doctor: Doctor,
  date: string,
  appointments: Appointment[],
): TimeSlot[] {
  const start = parseTime(doctor.workingHours.start);
  const end = parseTime(doctor.workingHours.end);
  const breakStart = parseTime(doctor.breakTime.start);
  const breakEnd = parseTime(doctor.breakTime.end);
  const step = doctor.appointmentDurationMinutes;

  const booked = new Set(
    appointments
      .filter(
        (a) =>
          a.doctorId === doctor.id &&
          a.date === date &&
          a.status !== 'cancelled',
      )
      .map((a) => a.time),
  );

  const slots: TimeSlot[] = [];
  for (let t = start; t + step <= end; t += step) {
    const inBreak = t >= breakStart && t < breakEnd;
    if (inBreak) continue;
    const time = formatTime(t);
    slots.push({ time, available: !booked.has(time) });
  }
  return slots;
}

export function formatPrice(amount: number, locale = 'uz-UZ'): string {
  return new Intl.NumberFormat(locale, {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDistance(km?: number): string {
  if (km == null) return '';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}
