import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

export type DrivingRouteResult = {
  coordinates: { latitude: number; longitude: number }[];
  distanceMeters: number;
  durationSeconds: number;
  provider: 'google' | 'osrm';
};

@Injectable()
export class GeoService {
  private readonly logger = new Logger(GeoService.name);

  async getDrivingRoute(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
  ): Promise<DrivingRouteResult> {
    if (
      ![originLat, originLng, destLat, destLng].every(
        (n) => typeof n === 'number' && Number.isFinite(n),
      )
    ) {
      throw new BadRequestException('Invalid coordinates');
    }

    const googleKey = (
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.GOOGLE_DIRECTIONS_API_KEY ||
      ''
    ).trim();

    if (googleKey && googleKey !== 'REPLACE_WITH_GOOGLE_MAPS_API_KEY') {
      try {
        return await this.googleDriving(
          originLat,
          originLng,
          destLat,
          destLng,
          googleKey,
        );
      } catch (err) {
        this.logger.warn(
          `Google Directions failed, falling back to OSRM: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }

    return this.osrmDriving(originLat, originLng, destLat, destLng);
  }

  private async googleDriving(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
    apiKey: string,
  ): Promise<DrivingRouteResult> {
    const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
    url.searchParams.set('origin', `${originLat},${originLng}`);
    url.searchParams.set('destination', `${destLat},${destLng}`);
    url.searchParams.set('mode', 'driving');
    url.searchParams.set('key', apiKey);

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new ServiceUnavailableException('Directions provider error');
    }
    const data = (await res.json()) as {
      status: string;
      routes?: {
        overview_polyline?: { points?: string };
        legs?: { distance?: { value?: number }; duration?: { value?: number } }[];
      }[];
    };

    if (data.status !== 'OK' || !data.routes?.[0]) {
      throw new ServiceUnavailableException(`Directions status: ${data.status}`);
    }

    const route = data.routes[0];
    const encoded = route.overview_polyline?.points;
    if (!encoded) {
      throw new ServiceUnavailableException('No polyline in Directions response');
    }

    const coordinates = decodeGooglePolyline(encoded);
    if (coordinates.length < 2) {
      throw new ServiceUnavailableException('Invalid polyline');
    }

    const distanceMeters =
      route.legs?.reduce((sum, leg) => sum + (leg.distance?.value ?? 0), 0) ?? 0;
    const durationSeconds =
      route.legs?.reduce((sum, leg) => sum + (leg.duration?.value ?? 0), 0) ?? 0;

    return {
      coordinates,
      distanceMeters,
      durationSeconds,
      provider: 'google',
    };
  }

  private async osrmDriving(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
  ): Promise<DrivingRouteResult> {
    // OSRM expects lon,lat order — public driving profile (real roads).
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${originLng},${originLat};${destLng},${destLat}` +
      `?overview=full&geometries=geojson`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new ServiceUnavailableException('Routing provider unavailable');
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
      throw new ServiceUnavailableException('No driving route found');
    }

    const route = data.routes[0];
    const coordinates = route.geometry!.coordinates!.map(([lng, lat]) => ({
      latitude: lat,
      longitude: lng,
    }));

    if (coordinates.length < 2) {
      throw new ServiceUnavailableException('Invalid route geometry');
    }

    return {
      coordinates,
      distanceMeters: Math.round(route.distance ?? 0),
      durationSeconds: Math.round(route.duration ?? 0),
      provider: 'osrm',
    };
  }
}

/** Google encoded polyline algorithm. */
function decodeGooglePolyline(encoded: string) {
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;
  const coordinates: { latitude: number; longitude: number }[] = [];

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coordinates.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return coordinates;
}
