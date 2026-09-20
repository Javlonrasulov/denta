import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import MapView, {
  UrlTile,
  type MapType,
  type Region,
  PROVIDER_DEFAULT,
} from 'react-native-maps';

import { ClinicMarker } from './ClinicMarker';
import { TASHKENT_REGION } from './mapUtils';
import type { Clinic } from '@/types';

/** Vector-style streets — works without a Google Maps API key. */
const STREET_TILES =
  'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';
/** Satellite imagery fallback (Esri). */
const SATELLITE_TILES =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

export type DentalMapHandle = {
  animateToRegion: (region: Region, duration?: number) => void;
  fitToClinics: (clinics: Clinic[]) => void;
};

type Props = {
  clinics: Clinic[];
  selectedClinicId?: string | null;
  userLocation?: { latitude: number; longitude: number } | null;
  onSelectClinic?: (clinicId: string) => void;
  initialRegion?: Region;
  mapType?: MapType;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const DentalMap = forwardRef<DentalMapHandle, Props>(
  function DentalMap(
    {
      clinics,
      selectedClinicId,
      userLocation,
      onSelectClinic,
      initialRegion = TASHKENT_REGION,
      mapType = 'standard',
      compact = false,
      style,
    },
    ref,
  ) {
    const mapRef = useRef<MapView>(null);
    const useSatellite = mapType === 'satellite';

    useImperativeHandle(ref, () => ({
      animateToRegion(region, duration = 450) {
        mapRef.current?.animateToRegion(region, duration);
      },
      fitToClinics(list) {
        if (!list.length) return;
        mapRef.current?.fitToCoordinates(
          list.map((c) => c.coordinates),
          {
            edgePadding: compact
              ? { top: 36, right: 36, bottom: 48, left: 36 }
              : { top: 160, right: 48, bottom: 220, left: 48 },
            animated: true,
          },
        );
      },
    }));

    return (
      <View style={[styles.fill, style]} collapsable={false}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={initialRegion}
          mapType={Platform.OS === 'android' ? 'none' : mapType}
          showsUserLocation={!!userLocation}
          showsMyLocationButton={false}
          showsCompass={false}
          rotateEnabled={false}
          pitchEnabled={false}
          toolbarEnabled={false}
          scrollEnabled
          zoomEnabled
          zoomControlEnabled={false}
          loadingEnabled
          moveOnMarkerPress={false}
        >
          <UrlTile
            key={useSatellite ? 'sat' : 'street'}
            urlTemplate={useSatellite ? SATELLITE_TILES : STREET_TILES}
            maximumZ={19}
            flipY={false}
            shouldReplaceMapContent
            zIndex={-1}
          />
          {clinics.map((clinic) => (
            <ClinicMarker
              key={clinic.id}
              id={clinic.id}
              coordinate={clinic.coordinates}
              title={clinic.name}
              selected={clinic.id === selectedClinicId}
              availableToday={clinic.isOpenNow}
              onPress={onSelectClinic}
            />
          ))}
        </MapView>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  fill: { flex: 1, minHeight: 160 },
  map: { ...StyleSheet.absoluteFillObject },
});
