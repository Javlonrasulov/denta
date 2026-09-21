import type { Region } from 'react-native-maps';

export type UzRegionId =
  | 'tashkent_city'
  | 'andijon'
  | 'buxoro'
  | 'fargona'
  | 'jizzax'
  | 'xorazm'
  | 'namangan'
  | 'navoiy'
  | 'qashqadaryo'
  | 'samarqand'
  | 'sirdaryo'
  | 'surxondaryo'
  | 'tashkent_region';

export type UzRegion = {
  id: UzRegionId;
  /** i18n key under map.regions.* */
  labelKey: string;
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

/** Toshkent shahri + 12 viloyat (camera centers). */
export const UZ_REGIONS: UzRegion[] = [
  {
    id: 'tashkent_city',
    labelKey: 'map.regions.tashkent_city',
    latitude: 41.3111,
    longitude: 69.2797,
    latitudeDelta: 0.12,
    longitudeDelta: 0.12,
  },
  {
    id: 'andijon',
    labelKey: 'map.regions.andijon',
    latitude: 40.7821,
    longitude: 72.3442,
    latitudeDelta: 0.22,
    longitudeDelta: 0.22,
  },
  {
    id: 'buxoro',
    labelKey: 'map.regions.buxoro',
    latitude: 39.7681,
    longitude: 64.4556,
    latitudeDelta: 0.22,
    longitudeDelta: 0.22,
  },
  {
    id: 'fargona',
    labelKey: 'map.regions.fargona',
    latitude: 40.3864,
    longitude: 71.7864,
    latitudeDelta: 0.22,
    longitudeDelta: 0.22,
  },
  {
    id: 'jizzax',
    labelKey: 'map.regions.jizzax',
    latitude: 40.1158,
    longitude: 67.8422,
    latitudeDelta: 0.25,
    longitudeDelta: 0.25,
  },
  {
    id: 'xorazm',
    labelKey: 'map.regions.xorazm',
    latitude: 41.55,
    longitude: 60.6333,
    latitudeDelta: 0.28,
    longitudeDelta: 0.28,
  },
  {
    id: 'namangan',
    labelKey: 'map.regions.namangan',
    latitude: 40.9983,
    longitude: 71.6726,
    latitudeDelta: 0.22,
    longitudeDelta: 0.22,
  },
  {
    id: 'navoiy',
    labelKey: 'map.regions.navoiy',
    latitude: 40.0985,
    longitude: 65.3792,
    latitudeDelta: 0.28,
    longitudeDelta: 0.28,
  },
  {
    id: 'qashqadaryo',
    labelKey: 'map.regions.qashqadaryo',
    latitude: 38.8606,
    longitude: 65.789,
    latitudeDelta: 0.28,
    longitudeDelta: 0.28,
  },
  {
    id: 'samarqand',
    labelKey: 'map.regions.samarqand',
    latitude: 39.6542,
    longitude: 66.9597,
    latitudeDelta: 0.22,
    longitudeDelta: 0.22,
  },
  {
    id: 'sirdaryo',
    labelKey: 'map.regions.sirdaryo',
    latitude: 40.4897,
    longitude: 68.7842,
    latitudeDelta: 0.25,
    longitudeDelta: 0.25,
  },
  {
    id: 'surxondaryo',
    labelKey: 'map.regions.surxondaryo',
    latitude: 37.2242,
    longitude: 67.2783,
    latitudeDelta: 0.28,
    longitudeDelta: 0.28,
  },
  {
    id: 'tashkent_region',
    labelKey: 'map.regions.tashkent_region',
    latitude: 41.035,
    longitude: 69.361,
    latitudeDelta: 0.35,
    longitudeDelta: 0.35,
  },
];

export function regionToCamera(region: UzRegion): Region {
  return {
    latitude: region.latitude,
    longitude: region.longitude,
    latitudeDelta: region.latitudeDelta,
    longitudeDelta: region.longitudeDelta,
  };
}
