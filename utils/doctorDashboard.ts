import type { Appointment, Doctor, FinanceRecord, Patient, Room } from '@/types';
import { generateTimeSlots } from '@/utils/slots';

export const DEMO_DOCTOR_ID =
  process.env.EXPO_PUBLIC_USE_MOCK_API === 'true' ? 'doctor-1' : '';
/** @deprecated Use authenticated /doctors/me — only for mock mode */

export type TimelineKind =
  | 'completed'
  | 'current'
  | 'upcoming'
  | 'cancelled'
  | 'available';

export type TimelineItem = {
  id: string;
  time: string;
  endTime: string;
  durationMinutes: number;
  kind: TimelineKind;
  appointment?: Appointment;
};

export type DoctorAlert = {
  id: string;
  kind: 'recall' | 'payment' | 'unconfirmed';
  patientId?: string;
  patientName?: string;
  time?: string;
};

export type NextSlot = {
  start: string;
  end: string;
  durationMinutes: number;
};

export type DoctorDashboardModel = {
  todayKey: string;
  nowMinutes: number;
  todayAppointments: Appointment[];
  completedAppointments: Appointment[];
  remainingAppointments: Appointment[];
  nextAppointment: Appointment | null;
  currentAppointment: Appointment | null;
  nextAvailableSlot: NextSlot | null;
  todayRevenue: number;
  yesterdayRevenue: number;
  revenueDeltaPct: number | null;
  timeline: TimelineItem[];
  patientsToday: number;
  alerts: DoctorAlert[];
  room?: Room;
  durationMinutes: number;
};

export function localDateKey(date = new Date(), offsetDays = 0): string {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function formatMinutes(total: number): string {
  const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function minutesSinceMidnight(date = new Date()): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function appointmentDuration(appointment: Appointment, doctor?: Doctor | null): number {
  const fromService = doctor?.services.find((s) => s.name === appointment.serviceName)
    ?.durationMinutes;
  return fromService ?? doctor?.appointmentDurationMinutes ?? 30;
}

export function doctorGreetingName(fullName: string): string {
  const cleaned = fullName.replace(/^Dr\.?\s*/i, '').trim();
  const first = cleaned.split(/\s+/)[0] || cleaned;
  return `Dr. ${first}`;
}

export function endTimeFor(start: string, durationMinutes: number): string {
  return formatMinutes(parseMinutes(start) + durationMinutes);
}

function kindFor(
  appointment: Appointment,
  nowMinutes: number,
  durationMinutes: number,
): TimelineKind {
  if (appointment.status === 'cancelled') return 'cancelled';
  if (appointment.status === 'completed') return 'completed';
  const start = parseMinutes(appointment.time);
  const end = start + durationMinutes;
  if (nowMinutes >= start && nowMinutes < end) return 'current';
  return 'upcoming';
}

function revenueFor(appointments: Appointment[]): number {
  return appointments
    .filter((a) => a.status !== 'cancelled')
    .reduce((sum, a) => sum + a.price, 0);
}

function buildAlerts(params: {
  todayAppointments: Appointment[];
  patients: Patient[];
  finance: FinanceRecord[];
  doctorName: string;
}): DoctorAlert[] {
  const { todayAppointments, patients, finance, doctorName } = params;
  const alerts: DoctorAlert[] = [];
  const today = new Date();
  const recallMs = 120 * 24 * 60 * 60 * 1000;

  const recall = patients
    .filter((p) => p.status === 'active' && p.lastVisit)
    .map((p) => ({
      patient: p,
      age: today.getTime() - new Date(`${p.lastVisit}T00:00:00`).getTime(),
    }))
    .filter((row) => row.age >= recallMs)
    .sort((a, b) => b.age - a.age)[0];

  if (recall) {
    alerts.push({
      id: `recall-${recall.patient.id}`,
      kind: 'recall',
      patientId: recall.patient.id,
      patientName: recall.patient.fullName,
    });
  }

  const unpaid = finance.find(
    (r) =>
      r.type === 'income' &&
      (r.paymentStatus === 'pending' || r.paymentStatus === 'overdue' || r.paymentStatus === 'partial') &&
      r.doctorName === doctorName &&
      Boolean(r.patientName),
  );
  if (unpaid?.patientName) {
    const match = patients.find((p) => p.fullName === unpaid.patientName);
    alerts.push({
      id: `pay-${unpaid.id}`,
      kind: 'payment',
      patientId: match?.id,
      patientName: unpaid.patientName,
    });
  }

  const unconfirmed = todayAppointments.find(
    (a) => a.status === 'upcoming' && !a.notes,
  );
  if (unconfirmed) {
    alerts.push({
      id: `confirm-${unconfirmed.id}`,
      kind: 'unconfirmed',
      patientId: unconfirmed.patientId,
      patientName: unconfirmed.patientName,
      time: unconfirmed.time,
    });
  }

  return alerts.slice(0, 3);
}

function buildTimeline(
  appointments: Appointment[],
  doctor: Doctor | null | undefined,
  nowMinutes: number,
  durationFallback: number,
): TimelineItem[] {
  if (!doctor) {
    return appointments
      .slice()
      .sort((a, b) => a.time.localeCompare(b.time))
      .map((appointment) => {
        const duration = appointmentDuration(appointment, doctor);
        return {
          id: appointment.id,
          time: appointment.time,
          endTime: endTimeFor(appointment.time, duration),
          durationMinutes: duration,
          kind: kindFor(appointment, nowMinutes, duration),
          appointment,
        };
      });
  }

  const todayKey = localDateKey();
  const slots = generateTimeSlots(doctor, todayKey, appointments);
  const byTime = new Map(appointments.map((a) => [a.time, a]));
  const items: TimelineItem[] = [];
  let pendingGap: string | null = null;

  for (const slot of slots) {
    const appointment = byTime.get(slot.time);
    if (appointment) {
      if (pendingGap) {
        items.push({
          id: `free-${pendingGap}`,
          time: pendingGap,
          endTime: endTimeFor(pendingGap, durationFallback),
          durationMinutes: durationFallback,
          kind: 'available',
        });
        pendingGap = null;
      }
      const duration = appointmentDuration(appointment, doctor);
      items.push({
        id: appointment.id,
        time: appointment.time,
        endTime: endTimeFor(appointment.time, duration),
        durationMinutes: duration,
        kind: kindFor(appointment, nowMinutes, duration),
        appointment,
      });
    } else if (slot.available && !pendingGap) {
      pendingGap = slot.time;
    }
  }

  if (pendingGap && parseMinutes(pendingGap) > nowMinutes) {
    items.push({
      id: `free-${pendingGap}`,
      time: pendingGap,
      endTime: endTimeFor(pendingGap, durationFallback),
      durationMinutes: durationFallback,
      kind: 'available',
    });
  }

  return items;
}

export function buildDoctorDashboard(params: {
  appointments: Appointment[];
  doctor?: Doctor | null;
  patients?: Patient[];
  finance?: FinanceRecord[];
  rooms?: Room[];
  now?: Date;
  doctorId?: string;
}): DoctorDashboardModel {
  const now = params.now ?? new Date();
  const doctorId = params.doctorId ?? params.doctor?.id ?? DEMO_DOCTOR_ID;
  const todayKey = localDateKey(now);
  const yesterdayKey = localDateKey(now, -1);
  const nowMinutes = minutesSinceMidnight(now);
  const durationMinutes = params.doctor?.appointmentDurationMinutes ?? 30;

  const forDoctor = params.appointments.filter((a) => a.doctorId === doctorId);
  const todayAppointments = forDoctor
    .filter((a) => a.date === todayKey)
    .slice()
    .sort((a, b) => a.time.localeCompare(b.time));
  const yesterdayAppointments = forDoctor.filter((a) => a.date === yesterdayKey);

  const activeToday = todayAppointments.filter((a) => a.status !== 'cancelled');
  const completedAppointments = activeToday.filter((a) => a.status === 'completed');
  const remainingAppointments = activeToday.filter((a) => a.status === 'upcoming');

  const timed = activeToday.map((appointment) => {
    const duration = appointmentDuration(appointment, params.doctor);
    return { appointment, duration, kind: kindFor(appointment, nowMinutes, duration) };
  });

  const currentAppointment =
    timed.find((row) => row.kind === 'current')?.appointment ?? null;
  const nextAppointment =
    timed.find(
      (row) =>
        row.kind === 'upcoming' && parseMinutes(row.appointment.time) >= nowMinutes,
    )?.appointment ?? null;

  const slots = params.doctor
    ? generateTimeSlots(params.doctor, todayKey, todayAppointments)
    : [];
  const nextFree = slots.find(
    (slot) => slot.available && parseMinutes(slot.time) >= nowMinutes,
  );
  const nextAvailableSlot: NextSlot | null = nextFree
    ? {
        start: nextFree.time,
        end: endTimeFor(nextFree.time, durationMinutes),
        durationMinutes,
      }
    : null;

  const todayRevenue = revenueFor(todayAppointments);
  const yesterdayRevenue = revenueFor(yesterdayAppointments);
  const revenueDeltaPct =
    yesterdayRevenue > 0
      ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100)
      : null;

  return {
    todayKey,
    nowMinutes,
    todayAppointments,
    completedAppointments,
    remainingAppointments,
    nextAppointment,
    currentAppointment,
    nextAvailableSlot,
    todayRevenue,
    yesterdayRevenue,
    revenueDeltaPct,
    timeline: buildTimeline(todayAppointments, params.doctor, nowMinutes, durationMinutes),
    patientsToday: new Set(activeToday.map((a) => a.patientId)).size,
    alerts: buildAlerts({
      todayAppointments,
      patients: params.patients ?? [],
      finance: params.finance ?? [],
      doctorName: params.doctor?.fullName ?? '',
    }),
    room: params.rooms?.find((r) => r.doctorId === doctorId),
    durationMinutes,
  };
}

export type DoctorNotificationTarget = 'patient' | 'calendar' | 'finance';

export type DoctorNotification = {
  id: string;
  kind: 'reminder' | 'recall' | 'payment' | 'unconfirmed';
  titleKey: string;
  messageKey: string;
  messageParams?: Record<string, string>;
  patientId?: string;
  target: DoctorNotificationTarget;
  unread: boolean;
};

export function buildDoctorNotifications(model: DoctorDashboardModel): DoctorNotification[] {
  const items: DoctorNotification[] = [];

  if (model.nextAppointment) {
    items.push({
      id: `remind-${model.nextAppointment.id}`,
      kind: 'reminder',
      titleKey: 'notifications.appointment_reminder',
      messageKey: 'doctor_app.notify_reminder',
      messageParams: {
        name: model.nextAppointment.patientName,
        time: model.nextAppointment.time,
        service: model.nextAppointment.serviceName,
      },
      patientId: model.nextAppointment.patientId,
      target: 'patient',
      unread: true,
    });
  }

  for (const alert of model.alerts) {
    if (alert.kind === 'recall') {
      items.push({
        id: alert.id,
        kind: 'recall',
        titleKey: 'doctor_app.alerts',
        messageKey: 'doctor_app.alert_recall',
        messageParams: { name: alert.patientName ?? '' },
        patientId: alert.patientId,
        target: 'patient',
        unread: true,
      });
    } else if (alert.kind === 'payment') {
      items.push({
        id: alert.id,
        kind: 'payment',
        titleKey: 'notifications.payment',
        messageKey: 'doctor_app.alert_payment',
        messageParams: { name: alert.patientName ?? '' },
        patientId: alert.patientId,
        target: 'finance',
        unread: true,
      });
    } else {
      items.push({
        id: alert.id,
        kind: 'unconfirmed',
        titleKey: 'notifications.appointment_reminder',
        messageKey: 'doctor_app.alert_unconfirmed',
        messageParams: { time: alert.time ?? '' },
        patientId: alert.patientId,
        target: 'calendar',
        unread: true,
      });
    }
  }

  return items;
}
