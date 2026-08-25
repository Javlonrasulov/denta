import { MOCK_APPOINTMENTS } from '@/mocks/data';
import type { Appointment, AppointmentStatus } from '@/types';
import { ApiError, mockNetworkDelay } from './apiClient';

/** Module-level mutable store for mock create/cancel. Swap for NestJS later. */
let appointments: Appointment[] = MOCK_APPOINTMENTS.map((a) => ({ ...a }));

function nextId(): string {
  return `appt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export async function getAppointments(
  status?: AppointmentStatus,
): Promise<Appointment[]> {
  await mockNetworkDelay();
  if (!status) return [...appointments];
  return appointments.filter((a) => a.status === status);
}

export async function getAppointmentById(
  id: string,
): Promise<Appointment | null> {
  await mockNetworkDelay();
  return appointments.find((a) => a.id === id) ?? null;
}

export async function createAppointment(
  input: Omit<Appointment, 'id'>,
): Promise<Appointment> {
  await mockNetworkDelay();
  const created: Appointment = { ...input, id: nextId() };
  appointments = [created, ...appointments];
  return created;
}

export async function cancelAppointment(id: string): Promise<Appointment> {
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
