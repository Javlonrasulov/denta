import type { Doctor, TimeSlot } from '@/types';
import {
  ApiError,
  apiGet,
  apiPatch,
  apiPut,
  mockNetworkDelay,
  useMockApi,
} from './apiClient';
import { MOCK_CLINICS, MOCK_DOCTORS } from '@/mocks/data';
import { generateTimeSlots } from '@/utils/slots';
import type { Appointment } from '@/types';

export interface GetDoctorsParams {
  clinicId?: string;
  query?: string;
  specialization?: string;
  gender?: string;
}

export async function getDoctors(params?: GetDoctorsParams): Promise<Doctor[]> {
  if (!useMockApi()) {
    return apiGet<Doctor[]>('/doctors', { ...params }, false);
  }

  await mockNetworkDelay();
  let results = [...MOCK_DOCTORS];
  if (params?.clinicId) {
    results = results.filter((d) => d.clinicId === params.clinicId);
  }
  if (params?.query) {
    const q = params.query.toLowerCase();
    results = results.filter(
      (d) =>
        d.fullName.toLowerCase().includes(q) ||
        d.specialization.toLowerCase().includes(q),
    );
  }
  if (params?.specialization) {
    const spec = params.specialization.toLowerCase();
    results = results.filter((d) =>
      d.specialization.toLowerCase().includes(spec),
    );
  }
  if (params?.gender) {
    results = results.filter((d) => d.gender === params.gender);
  }
  return results;
}

export async function getDoctorById(id: string): Promise<Doctor | null> {
  if (!useMockApi()) {
    try {
      return await apiGet<Doctor>(`/doctors/${id}`, undefined, false);
    } catch {
      return null;
    }
  }
  await mockNetworkDelay();
  return MOCK_DOCTORS.find((d) => d.id === id) ?? null;
}

export async function getTopDoctors(limit = 5): Promise<Doctor[]> {
  if (!useMockApi()) {
    return apiGet<Doctor[]>('/doctors/top', { limit }, false);
  }
  await mockNetworkDelay();
  return [...MOCK_DOCTORS]
    .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
    .slice(0, limit);
}

export async function getAvailableToday(limit = 5): Promise<Doctor[]> {
  if (!useMockApi()) {
    return apiGet<Doctor[]>('/doctors/available-today', { limit }, false);
  }
  await mockNetworkDelay();
  const openClinicIds = new Set(
    MOCK_CLINICS.filter((c) => c.isOpenNow).map((c) => c.id),
  );
  return MOCK_DOCTORS.filter((d) => openClinicIds.has(d.clinicId)).slice(
    0,
    limit,
  );
}

/** Prefer server-side slots; mock path keeps local generation. */
export async function getDoctorSlots(
  doctorId: string,
  date: string,
  appointments: Appointment[] = [],
  opts?: { clinicId?: string; serviceId?: string },
): Promise<TimeSlot[]> {
  if (!useMockApi()) {
    return apiGet<TimeSlot[]>(
      `/doctors/${doctorId}/slots`,
      {
        date,
        ...(opts?.clinicId ? { clinicId: opts.clinicId } : {}),
        ...(opts?.serviceId ? { serviceId: opts.serviceId } : {}),
      },
      false,
    );
  }
  await mockNetworkDelay();
  const doctor = MOCK_DOCTORS.find((d) => d.id === doctorId);
  if (!doctor) {
    throw new ApiError(`Doctor not found: ${doctorId}`, 404);
  }
  return generateTimeSlots(doctor, date, appointments);
}

export async function updateMyDoctorProfile(
  patch: Record<string, unknown>,
): Promise<Doctor> {
  if (!useMockApi()) {
    return apiPatch<Doctor>('/doctors/me', patch);
  }
  await mockNetworkDelay();
  return MOCK_DOCTORS[0];
}

export async function getMyDoctorSchedule(): Promise<
  {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    breakStart?: string;
    breakEnd?: string;
    slotDuration?: number;
  }[]
> {
  if (!useMockApi()) {
    return apiGet('/doctors/me/schedule');
  }
  await mockNetworkDelay();
  return [];
}

export async function replaceMyDoctorSchedule(
  schedule: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    breakStart?: string;
    breakEnd?: string;
    slotDuration?: number;
  }[],
): Promise<unknown> {
  if (!useMockApi()) {
    return apiPut('/doctors/me/schedule', { schedule });
  }
  await mockNetworkDelay();
  return schedule;
}
