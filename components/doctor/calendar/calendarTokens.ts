import type { CalendarSlotKind } from '@/utils/doctorCalendar';

export type SlotTone = {
  accent: string;
  bg: string;
  bgDark: string;
  label: string;
  labelDark: string;
};

export const SLOT_TONE: Record<CalendarSlotKind, SlotTone> = {
  pending: {
    accent: '#B45309',
    bg: 'rgba(245, 158, 11, 0.12)',
    bgDark: 'rgba(245, 158, 11, 0.14)',
    label: '#B45309',
    labelDark: '#FBBF24',
  },
  confirmed: {
    accent: '#4338CA',
    bg: 'rgba(67, 56, 202, 0.1)',
    bgDark: 'rgba(129, 140, 248, 0.16)',
    label: '#4338CA',
    labelDark: '#A5B4FC',
  },
  in_progress: {
    accent: '#0E7490',
    bg: 'rgba(8, 145, 178, 0.1)',
    bgDark: 'rgba(34, 211, 238, 0.12)',
    label: '#0E7490',
    labelDark: '#67E8F9',
  },
  completed: {
    accent: '#15803D',
    bg: 'rgba(22, 163, 74, 0.1)',
    bgDark: 'rgba(74, 222, 128, 0.1)',
    label: '#15803D',
    labelDark: '#86EFAC',
  },
  cancelled: {
    accent: '#94A3B8',
    bg: 'rgba(148, 163, 184, 0.12)',
    bgDark: 'rgba(148, 163, 184, 0.12)',
    label: '#64748B',
    labelDark: '#94A3B8',
  },
  free: {
    accent: '#64748B',
    bg: 'rgba(255, 255, 255, 0.55)',
    bgDark: 'rgba(255, 255, 255, 0.03)',
    label: '#64748B',
    labelDark: '#94A3B8',
  },
  break: {
    accent: '#94A3B8',
    bg: 'rgba(148, 163, 184, 0.14)',
    bgDark: 'rgba(148, 163, 184, 0.1)',
    label: '#64748B',
    labelDark: '#94A3B8',
  },
};

export function statusKey(kind: CalendarSlotKind): string {
  switch (kind) {
    case 'pending':
      return 'doctor_app.status_pending';
    case 'confirmed':
      return 'doctor_app.status_confirmed';
    case 'in_progress':
      return 'doctor_app.status_in_progress';
    case 'completed':
      return 'appointments.status_completed';
    case 'cancelled':
      return 'appointments.status_cancelled';
    case 'break':
      return 'doctor_app.status_break';
    default:
      return 'doctor_app.status_free_slot';
  }
}
