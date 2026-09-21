import { Controller, Get, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../common/guards/auth.guards';
import { GeoService } from './geo.service';

@Controller('geo')
export class GeoController {
  constructor(private readonly geo: GeoService) {}

  /**
   * Driving directions: Google Directions when key configured, else OSRM.
   * Query: originLat, originLng, destLat, destLng
   */
  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Get('directions')
  directions(
    @Query('originLat') originLat: string,
    @Query('originLng') originLng: string,
    @Query('destLat') destLat: string,
    @Query('destLng') destLng: string,
  ) {
    return this.geo.getDrivingRoute(
      Number(originLat),
      Number(originLng),
      Number(destLat),
      Number(destLng),
    );
  }
}
