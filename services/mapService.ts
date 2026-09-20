import type { Coordinates } from '@/types';
import { getClinics } from '@/services/clinicService';
import { mockNetworkDelay, useMockApi } from './apiClient';
import { MOCK_CLINICS } from '@/mocks/data';

export type MapProvider = 'google' | 'apple' | 'osm';

export type MapMarker = {
  id: string;
  coordinate: Coordinates;
  title: string;
  subtitle?: string;
  type: 'clinic' | 'doctor' | 'other';
  rating?: number;
};

export async function getClinicMarkers(): Promise<MapMarker[]> {
  if (!useMockApi()) {
    const clinics = await getClinics();
    return clinics.map((c) => ({
      id: c.id,
      coordinate: c.coordinates,
      title: c.name,
      subtitle: c.address,
      type: 'clinic' as const,
      rating: c.rating,
    }));
  }
  await mockNetworkDelay();
  return MOCK_CLINICS.map((c) => ({
    id: c.id,
    coordinate: c.coordinates,
    title: c.name,
    subtitle: c.address,
    type: 'clinic' as const,
    rating: c.rating,
  }));
}
