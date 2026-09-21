import { apiGet, useMockApi } from './apiClient';

export type LatLng = { latitude: number; longitude: number };

export type DrivingRoute = {
  coordinates: LatLng[];
  distanceMeters: number;
  durationSeconds: number;
  provider: 'google' | 'osrm';
};

type DirectionsQuery = {
  origin: LatLng;
  destination: LatLng;
  signal?: AbortSignal;
};

/**
 * Real DRIVING route only (roads). Never returns a straight-line path.
 * Prefers backend `/geo/directions` (Google key server-side or OSRM).
 * Falls back to public OSRM driving profile when API is unreachable.
 */
export async function fetchDrivingRoute(
  query: DirectionsQuery,
): Promise<DrivingRoute> {
  const { origin, destination, signal } = query;

  if (!useMockApi()) {
    try {
      const data = await apiGet<DrivingRoute>(
        '/geo/directions',
        {
          originLat: origin.latitude,
          originLng: origin.longitude,
          destLat: destination.latitude,
          destLng: destination.longitude,
        },
        false,
      );
      if (data?.coordinates?.length >= 2) {
        return data;
      }
    } catch {
      // fall through to OSRM
    }
  }

  return fetchOsrmDriving(origin, destination, signal);
}

async function fetchOsrmDriving(
  origin: LatLng,
  destination: LatLng,
  signal?: AbortSignal,
): Promise<DrivingRoute> {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${origin.longitude},${origin.latitude};` +
    `${destination.longitude},${destination.latitude}` +
    `?overview=full&geometries=geojson`;

  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error('Routing provider unavailable');
  }

  const data = (await res.json()) as {
    code?: string;
    routes?: {
      distance?: number;
      duration?: number;
      geometry?: { coordinates?: [number, number][] };
    }[];
  };

  if (data.code !== 'Ok' || !data.routes?.[0]?.geometry?.coordinates?.length) {
    throw new Error('No driving route found');
  }

  const route = data.routes[0];
  const coordinates = route.geometry!.coordinates!.map(([lng, lat]) => ({
    latitude: lat,
    longitude: lng,
  }));

  if (coordinates.length < 2) {
    throw new Error('Invalid route geometry');
  }

  return {
    coordinates,
    distanceMeters: Math.round(route.distance ?? 0),
    durationSeconds: Math.round(route.duration ?? 0),
    provider: 'osrm',
  };
}

export function formatRouteDistance(
  meters: number,
  units: { m: string; km: string } = { m: 'm', km: 'km' },
): string {
  if (meters < 1000) return `${Math.round(meters)} ${units.m}`;
  const km = meters / 1000;
  const value = km >= 10 ? km.toFixed(0) : km.toFixed(1);
  return `${value} ${units.km}`;
}

export function formatRouteDurationMinutes(seconds: number): number {
  return Math.max(1, Math.round(seconds / 60));
}
