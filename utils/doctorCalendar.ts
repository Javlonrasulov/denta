import type { Appointment, Doctor, FinanceRecord, Patient } from '@/types';
import {
  DEMO_DOCTOR_ID,
  appointmentDuration,
  endTimeFor,
  formatMinutes,
  localDateKey,
  minutesSinceMidnight,
  parseMinutes,
} from '@/utils/doctorDashboard';

export { formatMinutes, localDateKey, parseMinutes };
import { generateTimeSlots } from '@/utils/slots';

export const CALENDAR_PX_PER_MINUTE = 2.35;
export const DATE_STRIP_PAST = 14;
export const DATE_STRIP_FUTURE = 14;

export type CalendarView = 'day' | 'week' | 'month';
export type CalendarFilter = 'all' | 'today' | 'confirmed' | 'free' | 'cancelled';

export type CalendarSlotKind =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'free'
  | 'break';

export type CalendarSlot = {
  id: string;
  start: string;
  end: string;
  startMinutes: number;
  durationMinutes: number;
  kind: CalendarSlotKind;
  appointment?: Appointment;
};

export type DateStripItem = {
  key: string;
  weekdayIndex: number;
  day: number;
  isToday: boolean;
  isSelected: boolean;
  appointmentCount: number;
};

export type WeekDayAgenda = {
  key: string;
  weekdayIndex: number;
  day: number;
  isToday: boolean;
  isSelected: boolean;
  appointments: Appointment[];
  booked: number;
  free: number;
};

export type MonthCell = {
  key: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  count: number;
};

export type WorkingHoursSummary = {
  start: string;
  end: string;
  breakStart: string;
  breakEnd: string;
  durationMinutes: number;
  bookedSlots: number;
  freeSlots: number;
  nextAppointment: Appointment | null;
};

export type DoctorCalendarModel = {
  selectedKey: string;
  todayKey: string;
  isToday: boolean;
  nowMinutes: number;
  workStartMinutes: number;
  workEndMinutes: number;
  workingHours: WorkingHoursSummary;
  timeline: CalendarSlot[];
  visibleTimeline: CalendarSlot[];
  cancelledOnDay: Appointment[];
  weekDays: WeekDayAgenda[];
  monthCells: MonthCell[];
  monthLabelKey: string;
  dateStrip: DateStripItem[];
  dayAppointments: Appointment[];
  countsByDate: Record<string, number>;
};

export function dateFromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0, 0);
}

export function mondayIndex(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

export function startOfWeekMonday(date: Date): Date {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - mondayIndex(d));
  return d;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12, 0, 0, 0);
}

export function addDaysKey(key: string, days: number): string {
  return localDateKey(dateFromKey(key), days);
}

export function formatScheduleDate(date: Date, locale: string): string {
  const map: Record<string, string> = {
    uz: 'uz-Latn-UZ',
    'uz-Cyrl': 'uz-Cyrl-UZ',
    ru: 'ru-RU',
    en: 'en-GB',
  };
  const intlLocale = map[locale] ?? 'uz-Latn-UZ';
  try {
    const parts = new Intl.DateTimeFormat(intlLocale, {
      day: 'numeric',
      month: 'long',
      weekday: 'long',
    }).formatToParts(date);
    const day = parts.find((p) => p.type === 'day')?.value ?? '';
    const month = parts.find((p) => p.type === 'month')?.value ?? '';
    const weekday = parts.find((p) => p.type === 'weekday')?.value ?? '';
    const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
    if (locale.startsWith('en')) return `${cap(weekday)}, ${day} ${cap(month)}`;
    return `${day}-${cap(month)}, ${cap(weekday)}`;
  } catch {
    return date.toDateString();
  }
}

export function formatMonthTitle(date: Date, locale: string): string {
  const map: Record<string, string> = {
    uz: 'uz-Latn-UZ',
    'uz-Cyrl': 'uz-Cyrl-UZ',
    ru: 'ru-RU',
    en: 'en-GB',
  };
  const intlLocale = map[locale] ?? 'uz-Latn-UZ';
  try {
    const raw = new Intl.DateTimeFormat(intlLocale, { month: 'long', year: 'numeric' }).format(date);
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  } catch {
    return `${date.getMonth() + 1} ${date.getFullYear()}`;
  }
}

export function slotKindFor(
  appointment: Appointment,
  nowMinutes: number,
  durationMinutes: number,
  isToday: boolean,
): CalendarSlotKind {
  if (appointment.status === 'cancelled') return 'cancelled';
  if (appointment.status === 'completed') return 'completed';
  const start = parseMinutes(appointment.time);
  const end = start + durationMinutes;
  if (isToday && nowMinutes >= start && nowMinutes < end) return 'in_progress';
  if (appointment.notes) return 'confirmed';
  return 'pending';
}

function countsForDoctor(
  appointments: Appointment[],
  doctorId: string,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const apt of appointments) {
    if (apt.doctorId !== doctorId || apt.status === 'cancelled') continue;
    counts[apt.date] = (counts[apt.date] ?? 0) + 1;
  }
  return counts;
}

export function buildDayTimeline(
  doctor: Doctor | null | undefined,
  dateKey: string,
  appointments: Appointment[],
  nowMinutes: number,
  isToday: boolean,
): CalendarSlot[] {
  if (!doctor) {
    return appointments
      .filter((a) => a.date === dateKey)
      .slice()
      .sort((a, b) => a.time.localeCompare(b.time))
      .map((appointment) => {
        const duration = appointmentDuration(appointment, doctor);
        return {
          id: appointment.id,
          start: appointment.time,
          end: endTimeFor(appointment.time, duration),
          startMinutes: parseMinutes(appointment.time),
          durationMinutes: duration,
          kind: slotKindFor(appointment, nowMinutes, duration, isToday),
          appointment,
        };
      });
  }

  const start = parseMinutes(doctor.workingHours.start);
  const end = parseMinutes(doctor.workingHours.end);
  const breakStart = parseMinutes(doctor.breakTime.start);
  const breakEnd = parseMinutes(doctor.breakTime.end);
  const step = doctor.appointmentDurationMinutes || 30;

  const dayAppts = appointments
    .filter((a) => a.doctorId === doctor.id && a.date === dateKey)
    .slice()
    .sort((a, b) => a.time.localeCompare(b.time));

  const active = dayAppts.filter((a) => a.status !== 'cancelled');
  const occupied = active.map((appointment) => {
    const duration = appointmentDuration(appointment, doctor);
    const from = parseMinutes(appointment.time);
    return { appointment, duration, from, to: from + duration };
  });

  const slots: CalendarSlot[] = [];
  let cursor = start;

  while (cursor < end) {
    if (cursor >= breakStart && cursor < breakEnd) {
      slots.push({
        id: `break-${dateKey}`,
        start: formatMinutes(breakStart),
        end: formatMinutes(breakEnd),
        startMinutes: breakStart,
        durationMinutes: breakEnd - breakStart,
        kind: 'break',
      });
      cursor = breakEnd;
      continue;
    }

    const occupying = occupied.find((row) => cursor >= row.from && cursor < row.to);
    if (occupying) {
      if (cursor === occupying.from || slots[slots.length - 1]?.appointment?.id !== occupying.appointment.id) {
        slots.push({
          id: occupying.appointment.id,
          start: occupying.appointment.time,
          end: formatMinutes(occupying.to),
          startMinutes: occupying.from,
          durationMinutes: occupying.duration,
          kind: slotKindFor(occupying.appointment, nowMinutes, occupying.duration, isToday),
          appointment: occupying.appointment,
        });
      }
      cursor = occupying.to;
      continue;
    }

    const nextBreak = cursor < breakStart ? breakStart : end;
    const nextAppt = occupied
      .filter((row) => row.from > cursor)
      .reduce((min, row) => Math.min(min, row.from), end);
    const slotEnd = Math.min(cursor + step, nextBreak, nextAppt, end);
    if (slotEnd <= cursor) break;
    slots.push({
      id: `free-${dateKey}-${formatMinutes(cursor)}`,
      start: formatMinutes(cursor),
      end: formatMinutes(slotEnd),
      startMinutes: cursor,
      durationMinutes: slotEnd - cursor,
      kind: 'free',
    });
    cursor = slotEnd;
  }

  return slots;
}

function occupancyForDay(
  doctor: Doctor | null | undefined,
  dateKey: string,
  appointments: Appointment[],
): { booked: number; free: number } {
  if (!doctor) {
    const booked = appointments.filter(
      (a) => a.date === dateKey && a.status !== 'cancelled',
    ).length;
    return { booked, free: 0 };
  }
  const slots = generateTimeSlots(
    doctor,
    dateKey,
    appointments.filter((a) => a.date === dateKey),
  );
  return {
    booked: slots.filter((s) => !s.available).length,
    free: slots.filter((s) => s.available).length,
  };
}

function matchesFilter(slot: CalendarSlot, filter: CalendarFilter): boolean {
  if (filter === 'all' || filter === 'today') return true;
  if (filter === 'free') return slot.kind === 'free';
  if (filter === 'cancelled') return slot.kind === 'cancelled';
  if (filter === 'confirmed') {
    return slot.kind === 'confirmed' || slot.kind === 'in_progress';
  }
  return true;
}

export function buildDoctorCalendar(params: {
  appointments: Appointment[];
  doctor?: Doctor | null;
  selectedKey: string;
  filter: CalendarFilter;
  now?: Date;
  doctorId?: string;
}): DoctorCalendarModel {
  const now = params.now ?? new Date();
  const doctorId = params.doctorId ?? params.doctor?.id ?? DEMO_DOCTOR_ID;
  const todayKey = localDateKey(now);
  const selectedKey = params.selectedKey || todayKey;
  const isToday = selectedKey === todayKey;
  const nowMinutes = minutesSinceMidnight(now);
  const doctor = params.doctor;
  const forDoctor = params.appointments.filter((a) => a.doctorId === doctorId);
  const dayAppointments = forDoctor
    .filter((a) => a.date === selectedKey)
    .slice()
    .sort((a, b) => a.time.localeCompare(b.time));
  const cancelledOnDay = dayAppointments.filter((a) => a.status === 'cancelled');
  const countsByDate = countsForDoctor(forDoctor, doctorId);

  const timeline = buildDayTimeline(doctor, selectedKey, forDoctor, nowMinutes, isToday);
  const visibleTimeline =
    params.filter === 'cancelled'
      ? cancelledOnDay.map((appointment) => {
          const duration = appointmentDuration(appointment, doctor);
          return {
            id: appointment.id,
            start: appointment.time,
            end: endTimeFor(appointment.time, duration),
            startMinutes: parseMinutes(appointment.time),
            durationMinutes: duration,
            kind: 'cancelled' as const,
            appointment,
          };
        })
      : timeline.filter((slot) => matchesFilter(slot, params.filter));

  const occ = occupancyForDay(doctor, selectedKey, forDoctor);
  const remaining = dayAppointments.filter((a) => a.status === 'upcoming');
  const nextAppointment = isToday
    ? remaining.find((a) => parseMinutes(a.time) >= nowMinutes) ?? remaining[0] ?? null
    : remaining[0] ?? null;

  const selectedDate = dateFromKey(selectedKey);
  const dateStrip: DateStripItem[] = [];
  for (let i = -DATE_STRIP_PAST; i <= DATE_STRIP_FUTURE; i += 1) {
    const key = localDateKey(now, i);
    const date = dateFromKey(key);
    dateStrip.push({
      key,
      weekdayIndex: mondayIndex(date),
      day: date.getDate(),
      isToday: key === todayKey,
      isSelected: key === selectedKey,
      appointmentCount: countsByDate[key] ?? 0,
    });
  }

  const weekStart = startOfWeekMonday(selectedDate);
  const weekDays: WeekDayAgenda[] = Array.from({ length: 7 }, (_, i) => {
    const key = localDateKey(weekStart, i);
    const date = dateFromKey(key);
    const occDay = occupancyForDay(doctor, key, forDoctor);
    return {
      key,
      weekdayIndex: i,
      day: date.getDate(),
      isToday: key === todayKey,
      isSelected: key === selectedKey,
      appointments: forDoctor
        .filter((a) => a.date === key && a.status !== 'cancelled')
        .slice()
        .sort((a, b) => a.time.localeCompare(b.time)),
      booked: occDay.booked,
      free: occDay.free,
    };
  });

  const monthStart = startOfMonth(selectedDate);
  const gridStart = startOfWeekMonday(monthStart);
  const monthCells: MonthCell[] = Array.from({ length: 42 }, (_, i) => {
    const key = localDateKey(gridStart, i);
    const date = dateFromKey(key);
    return {
      key,
      day: date.getDate(),
      inMonth: date.getMonth() === selectedDate.getMonth(),
      isToday: key === todayKey,
      isSelected: key === selectedKey,
      count: countsByDate[key] ?? 0,
    };
  });

  return {
    selectedKey,
    todayKey,
    isToday,
    nowMinutes,
    workStartMinutes: doctor ? parseMinutes(doctor.workingHours.start) : 9 * 60,
    workEndMinutes: doctor ? parseMinutes(doctor.workingHours.end) : 18 * 60,
    workingHours: {
      start: doctor?.workingHours.start ?? '09:00',
      end: doctor?.workingHours.end ?? '18:00',
      breakStart: doctor?.breakTime.start ?? '13:00',
      breakEnd: doctor?.breakTime.end ?? '14:00',
      durationMinutes: doctor?.appointmentDurationMinutes ?? 30,
      bookedSlots: occ.booked,
      freeSlots: occ.free,
      nextAppointment,
    },
    timeline,
    visibleTimeline,
    cancelledOnDay,
    weekDays,
    monthCells,
    monthLabelKey: selectedKey,
    dateStrip,
    dayAppointments,
    countsByDate,
  };
}

export function patientForAppointment(
  appointment: Appointment | undefined,
  patients: Patient[],
): Patient | undefined {
  if (!appointment) return undefined;
  return (
    patients.find((p) => p.id === appointment.patientId) ??
    patients.find((p) => p.fullName === appointment.patientName)
  );
}

export function financeForPatient(
  patientName: string | undefined,
  finance: FinanceRecord[],
  doctorName?: string,
): FinanceRecord | undefined {
  if (!patientName) return undefined;
  return finance.find(
    (r) =>
      r.patientName === patientName &&
      r.type === 'income' &&
      (!doctorName || r.doctorName === doctorName) &&
      (r.paymentStatus === 'pending' || r.paymentStatus === 'overdue'),
  );
}

export function slotTop(slotStartMinutes: number, workStartMinutes: number): number {
  return Math.max(0, (slotStartMinutes - workStartMinutes) * CALENDAR_PX_PER_MINUTE);
}

export function slotHeight(durationMinutes: number): number {
  return Math.max(44, durationMinutes * CALENDAR_PX_PER_MINUTE);
}

export function timelineHeight(workStart: number, workEnd: number): number {
  return Math.max(1, workEnd - workStart) * CALENDAR_PX_PER_MINUTE;
}
