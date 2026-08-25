import { MOCK_CLINICS } from '@/mocks/data';
import { mockNetworkDelay } from './apiClient';

export interface MapMarker {
  id: string;
  coordinate: { latitude: number; longitude: number };
  title: string;
  subtitle?: string;
  type: 'clinic' | 'doctor';
}

/**
 * Provider interface for Mapbox (or other map SDK) swap later.
 * Current mock only returns markers; no map rendering here.
 */
export interface MapProvider {
  /** Initialize the map SDK (e.g. Mapbox access token). */
  initialize(accessToken: string): Promise<void>;
  /** Convert clinic/doctor entities to map markers. */
  getMarkers(): Promise<MapMarker[]>;
  /** Optional: fit camera to markers. */
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
  }));
}
