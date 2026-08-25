import { MOCK_CLINICS } from '@/mocks/data';
import type { Clinic } from '@/types';
import { mockNetworkDelay } from './apiClient';

export interface GetClinicsParams {
  query?: string;
  specialization?: string;
  minRating?: number;
  availableToday?: boolean;
}

export async function getClinics(params?: GetClinicsParams): Promise<Clinic[]> {
  await mockNetworkDelay();

  let results = [...MOCK_CLINICS];

  if (params?.query) {
    const q = params.query.toLowerCase();
    results = results.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        c.specializations.some((s) => s.toLowerCase().includes(q)),
    );
  }

  if (params?.specialization) {
    const spec = params.specialization.toLowerCase();
    results = results.filter((c) =>
      c.specializations.some((s) => s.toLowerCase().includes(spec)),
    );
  }

  if (params?.minRating != null) {
    results = results.filter((c) => c.rating >= params.minRating!);
  }

  if (params?.availableToday) {
    results = results.filter((c) => c.isOpenNow);
  }

  return results;
}

export async function getClinicById(id: string): Promise<Clinic | null> {
  await mockNetworkDelay();
  return MOCK_CLINICS.find((c) => c.id === id) ?? null;
}

export async function getNearbyClinics(limit = 5): Promise<Clinic[]> {
  await mockNetworkDelay();
  return [...MOCK_CLINICS]
    .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
    .slice(0, limit);
}

export async function getPopularClinics(limit = 5): Promise<Clinic[]> {
  await mockNetworkDelay();
  return [...MOCK_CLINICS]
    .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
    .slice(0, limit);
}
