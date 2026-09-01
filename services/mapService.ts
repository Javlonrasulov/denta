import { MOCK_CLINICS } from '@/mocks/data';
import { mockNetworkDelay } from './apiClient';

export interface MapMarker {
  id: string;
  coordinate: { latitude: number; longitude: number };
  title: string;
  subtitle?: string;
  type: 'clinic' | 'doctor';
  rating?: number;
}

/**
 * Provider interface for Mapbox (or other map SDK) swap later.
 * UI uses `components/map/DentalMap` (react-native-maps today).
 */
export interface MapProvider {
  initialize(accessToken: string): Promise<void>;
  getMarkers(): Promise<MapMarker[]>;
  fitBounds?(markerIds: string[]): Promise<void>;
}

export async function getClinicMarkers(): Promise<MapMarker[]> {
  await mockNetworkDelay();
  return MOCK_CLINICS.map((clinic) => ({
    id: clinic.id,
    coordinate: clinic.coordinates,
    title: clinic.name,
    subtitle: clinic.address,
    type: 'clinic' as const,
    rating: clinic.rating,
  }));
}
