import type { Appointment, AppointmentStatus } from '@/types';
import {
  ApiError,
  apiGet,
  apiPatch,
  apiPost,
  mockNetworkDelay,
  useMockApi,
} from './apiClient';
import { MOCK_APPOINTMENTS } from '@/mocks/data';

let appointments: Appointment[] = MOCK_APPOINTMENTS.map((a) => ({ ...a }));

function nextId(): string {
  return `appt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export async function getAppointments(
  status?: AppointmentStatus,
): Promise<Appointment[]> {
  if (!useMockApi()) {
    return apiGet<Appointment[]>('/appointments', { status });
  }
  await mockNetworkDelay();
  if (!status) return [...appointments];
  return appointments.filter((a) => a.status === status);
}

export async function getAppointmentById(
  id: string,
): Promise<Appointment | null> {
  if (!useMockApi()) {
    try {
      return await apiGet<Appointment>(`/appointments/${id}`);
    } catch {
      return null;
    }
  }
  await mockNetworkDelay();
  return appointments.find((a) => a.id === id) ?? null;
}

export type CreateAppointmentInput = {
  doctorId: string;
  clinicId: string;
  serviceId?: string;
  branchId?: string;
  date: string;
  time: string;
  notes?: string;
  // Legacy mock fields (ignored by API)
  patientId?: string;
  patientName?: string;
  doctorName?: string;
  clinicName?: string;
  clinicAddress?: string;
  serviceName?: string;
  status?: AppointmentStatus;
  price?: number;
};

export async function createAppointment(
  input: CreateAppointmentInput | Omit<Appointment, 'id'>,
): Promise<Appointment> {
  if (!useMockApi()) {
    return apiPost<Appointment>('/appointments', {
      doctorId: input.doctorId,
      clinicId: input.clinicId,
      serviceId: 'serviceId' in input ? input.serviceId : undefined,
      branchId: 'branchId' in input ? input.branchId : undefined,
      date: input.date,
      time: input.time,
      notes: input.notes,
      source: 'CLIENT_APP',
    });
  }
  await mockNetworkDelay();
  const created: Appointment = {
    ...(input as Omit<Appointment, 'id'>),
    id: nextId(),
  };
  appointments = [created, ...appointments];
  return created;
}

export async function cancelAppointment(id: string): Promise<Appointment> {
  if (!useMockApi()) {
    try {
      return await apiPost<Appointment>(`/appointments/${id}/cancel`, {});
    } catch {
      return apiPatch<Appointment>(`/appointments/${id}/cancel`, {});
    }
  }
  await mockNetworkDelay();
  const index = appointments.findIndex((a) => a.id === id);
  if (index === -1) {
    throw new ApiError(`Appointment not found: ${id}`, 404);
  }
  const updated: Appointment = {
    ...appointments[index],
    status: 'cancelled',
  };
  appointments = [
    ...appointments.slice(0, index),
    updated,
    ...appointments.slice(index + 1),
  ];
  return updated;
}

export async function rescheduleAppointment(
  id: string,
  input: { date: string; time: string },
): Promise<Appointment> {
  if (!useMockApi()) {
    return apiPost<Appointment>(`/appointments/${id}/reschedule`, input);
  }
  await mockNetworkDelay();
  const index = appointments.findIndex((a) => a.id === id);
  if (index === -1) {
    throw new ApiError(`Appointment not found: ${id}`, 404);
  }
  const updated: Appointment = {
    ...appointments[index],
    date: input.date,
    time: input.time,
    status: 'upcoming',
  };
  appointments = [
    ...appointments.slice(0, index),
    updated,
    ...appointments.slice(index + 1),
  ];
  return updated;
}

export async function updateAppointmentStatus(
  id: string,
  status: 'IN_PROGRESS' | 'COMPLETED' | 'NO_SHOW' | 'CONFIRMED',
): Promise<Appointment> {
  if (!useMockApi()) {
    return apiPatch<Appointment>(`/appointments/${id}/status`, { status });
  }
  await mockNetworkDelay();
  const index = appointments.findIndex((a) => a.id === id);
  if (index === -1) {
    throw new ApiError(`Appointment not found: ${id}`, 404);
  }
  const mapped: AppointmentStatus =
    status === 'COMPLETED'
      ? 'completed'
      : status === 'NO_SHOW'
        ? 'cancelled'
        : 'upcoming';
  const updated: Appointment = {
    ...appointments[index],
    status: mapped,
  };
  appointments = [
    ...appointments.slice(0, index),
    updated,
    ...appointments.slice(index + 1),
  ];
  return updated;
}
