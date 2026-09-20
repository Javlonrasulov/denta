import type { Clinic } from '@/types';
import {
  apiGet,
  mockNetworkDelay,
  useMockApi,
} from './apiClient';
import { MOCK_CLINICS } from '@/mocks/data';

export interface GetClinicsParams {
  query?: string;
  specialization?: string;
  minRating?: number;
  availableToday?: boolean;
}

export async function getClinics(params?: GetClinicsParams): Promise<Clinic[]> {
  if (!useMockApi()) {
    return apiGet<Clinic[]>('/clinics', {
      query: params?.query,
      specialization: params?.specialization,
      minRating: params?.minRating,
      availableToday: params?.availableToday,
    }, false);
  }

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
  if (!useMockApi()) {
    try {
      return await apiGet<Clinic>(`/clinics/${id}`, undefined, false);
    } catch {
      return null;
    }
  }
  await mockNetworkDelay();
  return MOCK_CLINICS.find((c) => c.id === id) ?? null;
}

export async function getNearbyClinics(
  limit = 5,
  coords?: { latitude: number; longitude: number },
): Promise<Clinic[]> {
  if (!useMockApi()) {
    const latitude = coords?.latitude ?? 41.3111;
    const longitude = coords?.longitude ?? 69.2797;
    return apiGet<Clinic[]>(
      '/clinics/nearby',
      { latitude, longitude, limit, radiusKm: 25 },
      false,
    );
  }
  await mockNetworkDelay();
  return [...MOCK_CLINICS]
    .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
    .slice(0, limit);
}

export async function getPopularClinics(limit = 5): Promise<Clinic[]> {
  if (!useMockApi()) {
    return apiGet<Clinic[]>(
      '/clinics',
      { limit },
      false,
    );
  }
  await mockNetworkDelay();
  return [...MOCK_CLINICS]
    .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
    .slice(0, limit);
}
