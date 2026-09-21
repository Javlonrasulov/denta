import type { Clinic } from '@/types';
import Constants from 'expo-constants';
import type { Region } from 'react-native-maps';

/** Tashkent city center — default map camera. */
export const TASHKENT_REGION: Region = {
  latitude: 41.3111,
  longitude: 69.2797,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

const PLACEHOLDER_KEY = 'REPLACE_WITH_GOOGLE_MAPS_API_KEY';

/**
 * True when a real Google Maps API key is present (not the placeholder).
 * Without a key, DentalMap uses OSM/Carto tiles via PROVIDER_DEFAULT.
 */
export function isGoogleMapsConfigured(): boolean {
  const fromExtra = Constants.expoConfig?.extra?.googleMapsApiKey;
  const fromEnv = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  const key = String(fromExtra ?? fromEnv ?? '').trim();
  return Boolean(key && key !== PLACEHOLDER_KEY && key.length >= 20);
}

export type MapFilterId =
  | 'nearby'
  | 'available_today'
  | 'rating_45'
  | 'open_24'
  | 'price'
  | 'specialty';

export const MAP_FILTER_IDS: MapFilterId[] = [
  'nearby',
  'available_today',
  'rating_45',
  'open_24',
  'price',
  'specialty',
];

export function filterClinicsForMap(
  clinics: Clinic[],
  active: MapFilterId[],
): Clinic[] {
  let result = clinics;
  if (active.includes('nearby')) {
    result = [...result].sort(
      (a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99),
    );
  }
  if (active.includes('available_today')) {
    result = result.filter((c) => c.isOpenNow);
  }
  if (active.includes('rating_45')) {
    result = result.filter((c) => c.rating >= 4.5);
  }
  if (active.includes('open_24')) {
    result = result.filter((c) =>
      c.workingHours.some((h) => !h.closed && h.open === '00:00' && h.close === '23:59'),
    );
  }
  if (active.includes('price')) {
    result = [...result].sort((a, b) => a.priceFrom - b.priceFrom);
  }
  return result;
}

export function formatDistance(km?: number): string {
  if (km == null) return '';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}
