import { MOCK_CLINICS, MOCK_DOCTORS } from '@/mocks/data';
import type { Appointment, Doctor, TimeSlot } from '@/types';
import { generateTimeSlots } from '@/utils/slots';
import { ApiError, mockNetworkDelay } from './apiClient';

export interface GetDoctorsParams {
  clinicId?: string;
  query?: string;
  specialization?: string;
  gender?: string;
}

export async function getDoctors(params?: GetDoctorsParams): Promise<Doctor[]> {
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
  await mockNetworkDelay();
  return MOCK_DOCTORS.find((d) => d.id === id) ?? null;
}

export async function getTopDoctors(limit = 5): Promise<Doctor[]> {
  await mockNetworkDelay();
  return [...MOCK_DOCTORS]
    .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
    .slice(0, limit);
}

export async function getAvailableToday(limit = 5): Promise<Doctor[]> {
  await mockNetworkDelay();
  const openClinicIds = new Set(
    MOCK_CLINICS.filter((c) => c.isOpenNow).map((c) => c.id),
  );
  return MOCK_DOCTORS.filter((d) => openClinicIds.has(d.clinicId)).slice(
    0,
    limit,
  );
}

export async function getDoctorSlots(
  doctorId: string,
  date: string,
  appointments: Appointment[],
): Promise<TimeSlot[]> {
  await mockNetworkDelay();
  const doctor = MOCK_DOCTORS.find((d) => d.id === doctorId);
  if (!doctor) {
    throw new ApiError(`Doctor not found: ${doctorId}`, 404);
  }
  return generateTimeSlots(doctor, date, appointments);
}
