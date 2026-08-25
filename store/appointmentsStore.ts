import { create } from 'zustand';

import { Appointment } from '@/types';
import { MOCK_APPOINTMENTS } from '@/mocks/data';

interface BookingDraft {
  clinicId?: string;
  doctorId?: string;
  serviceId?: string;
  serviceName?: string;
  price?: number;
  date?: string;
  time?: string;
}

interface AppointmentsState {
  appointments: Appointment[];
  draft: BookingDraft;
  setDraft: (patch: Partial<BookingDraft>) => void;
  clearDraft: () => void;
  addAppointment: (appointment: Appointment) => void;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => void;
}

export const useAppointmentsStore = create<AppointmentsState>((set) => ({
  appointments: [...MOCK_APPOINTMENTS],
  draft: {},
  setDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
  clearDraft: () => set({ draft: {} }),
  addAppointment: (appointment) =>
    set((s) => ({ appointments: [appointment, ...s.appointments] })),
  updateAppointmentStatus: (id, status) =>
    set((s) => ({
      appointments: s.appointments.map((a) => (a.id === id ? { ...a, status } : a)),
    })),
}));
