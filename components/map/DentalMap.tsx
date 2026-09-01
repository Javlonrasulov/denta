import { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import MapView, {
  type MapType,
  type Region,
  PROVIDER_DEFAULT,
} from 'react-native-maps';

import { ClinicMarker } from './ClinicMarker';
import { TASHKENT_REGION } from './mapUtils';
import type { Clinic } from '@/types';

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
              ? { top: 28, right: 28, bottom: 28, left: 28 }
              : { top: 160, right: 48, bottom: 220, left: 48 },
            animated: true,
          },
        );
      },
    }));

    return (
      <View style={[styles.fill, style]}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={PROVIDER_DEFAULT}
          initialRegion={initialRegion}
          mapType={mapType}
          showsUserLocation={!!userLocation}
          showsMyLocationButton={false}
          showsCompass={false}
          rotateEnabled={false}
          pitchEnabled={false}
          toolbarEnabled={false}
          zoomControlEnabled={compact}
        >
          {clinics.map((clinic) => (
            <ClinicMarker
              key={clinic.id}
              id={clinic.id}
              coordinate={clinic.coordinates}
              rating={clinic.rating}
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
  fill: { flex: 1 },
});
