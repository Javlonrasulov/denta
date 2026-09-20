import { useQuery } from '@tanstack/react-query';
import type { Doctor } from '@/types';
import { apiGet, useMockApi } from '@/services/apiClient';
import { getDoctorById } from '@/services/doctorService';
import { MOCK_DOCTORS } from '@/mocks/data';

/** Current authenticated doctor — never uses hardcoded IDs when API is live. */
export async function getMyDoctor(): Promise<Doctor | null> {
  if (!useMockApi()) {
    const me = await apiGet<{
      id: string;
      clinicId: string;
      fullName: string;
      avatar: string | null;
      specialty: string;
      experienceYears: number;
      rating: number;
      reviewCount: number;
      bio: string;
      languages: string[];
      workingHours: { start: string; end: string };
      appointmentDuration: number;
    }>('/doctors/me');

    // Map DoctorProfileDto → Doctor (marketplace shape used by UI)
    const full = await apiGet<Doctor>(`/doctors/${me.id}`, undefined, false).catch(
      () => null,
    );
    if (full) return full;

    return {
      id: me.id,
      clinicId: me.clinicId,
      fullName: me.fullName,
      photoUrl: me.avatar ?? '',
      specialization: me.specialty,
      experienceYears: me.experienceYears,
      rating: me.rating,
      reviewCount: me.reviewCount,
      gender: 'male',
      languages: me.languages as Doctor['languages'],
      bio: me.bio,
      priceFrom: 0,
      workingHours: me.workingHours,
      breakTime: { start: '13:00', end: '14:00' },
      appointmentDurationMinutes: me.appointmentDuration,
      services: [],
    };
  }

  // Mock fallback: first mock doctor (dev only)
  return MOCK_DOCTORS[0] ?? null;
}

export function useDoctorMe() {
  return useQuery({
    queryKey: ['doctors', 'me'],
    queryFn: getMyDoctor,
    staleTime: 60_000,
  });
}

/** @deprecated Prefer useDoctorMe — kept for detail screens by id */
export { getDoctorById };
