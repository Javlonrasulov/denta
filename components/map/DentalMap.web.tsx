import { forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { OsmTileMap } from './OsmTileMap';
import { TASHKENT_REGION } from './mapUtils';
import type { Clinic } from '@/types';

export type DentalMapHandle = {
  animateToRegion: (
    region: {
      latitude: number;
      longitude: number;
      latitudeDelta: number;
      longitudeDelta: number;
    },
    duration?: number,
  ) => void;
  fitToClinics: (clinics: Clinic[]) => void;
};

type Props = {
  clinics: Clinic[];
  selectedClinicId?: string | null;
  userLocation?: { latitude: number; longitude: number } | null;
  onSelectClinic?: (clinicId: string) => void;
  initialRegion?: typeof TASHKENT_REGION;
  mapType?: string;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Web: react-native-maps is native-only — use OSM tile map instead. */
export const DentalMap = forwardRef<DentalMapHandle, Props>(function DentalMap(
  { clinics, onSelectClinic, mapType = 'standard', style },
  ref,
) {
  useImperativeHandle(ref, () => ({
    animateToRegion() {},
    fitToClinics() {},
  }));

  return (
    <View style={[styles.fill, style]} collapsable={false}>
      <OsmTileMap
        clinics={clinics}
        satellite={mapType === 'satellite'}
        onSelectClinic={onSelectClinic}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  fill: { flex: 1, minHeight: 160 },
});
