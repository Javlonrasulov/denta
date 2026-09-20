import { create } from 'zustand';

import { Appointment } from '@/types';

interface BookingDraft {
  clinicId?: string;
  doctorId?: string;
  serviceId?: string;
  serviceName?: string;
  price?: number;
  date?: string;
  time?: string;
  /** When set, confirm flow calls reschedule instead of create */
  rescheduleAppointmentId?: string;
}

interface AppointmentsState {
  appointments: Appointment[];
  draft: BookingDraft;
  setDraft: (patch: Partial<BookingDraft>) => void;
  clearDraft: () => void;
  setAppointments: (appointments: Appointment[]) => void;
  addAppointment: (appointment: Appointment) => void;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => void;
  removeAppointment: (id: string) => void;
}

export const useAppointmentsStore = create<AppointmentsState>((set) => ({
  appointments: [],
  draft: {},
  setDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
  clearDraft: () => set({ draft: {} }),
  setAppointments: (appointments) => set({ appointments }),
  addAppointment: (appointment) =>
    set((s) => ({ appointments: [appointment, ...s.appointments] })),
  updateAppointmentStatus: (id, status) =>
    set((s) => ({
      appointments: s.appointments.map((a) => (a.id === id ? { ...a, status } : a)),
    })),
  removeAppointment: (id) =>
    set((s) => ({
      appointments: s.appointments.filter((a) => a.id !== id),
    })),
}));
