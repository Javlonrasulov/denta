import { useEffect, useState } from 'react';
import { Marker } from 'react-native-maps';
import * as Haptics from 'expo-haptics';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

type Props = {
  id: string;
  coordinate: { latitude: number; longitude: number };
  title: string;
  selected?: boolean;
  availableToday?: boolean;
  onPress?: (id: string) => void;
};

export function ClinicMarker({
  id,
  coordinate,
  title,
  selected,
  availableToday,
  onPress,
}: Props) {
  const { colors } = useTheme();
  // Android custom markers stay blank unless tracksViewChanges is true briefly.
  const [tracks, setTracks] = useState(true);

  const fill = selected
    ? colors.primary
    : availableToday
      ? colors.secondary
      : '#64748B';

  useEffect(() => {
    setTracks(true);
    const t = setTimeout(() => setTracks(false), 650);
    return () => clearTimeout(t);
  }, [selected, availableToday, fill]);

  return (
    <Marker
      coordinate={coordinate}
      tracksViewChanges={tracks || !!selected}
      title={title}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress?.(id);
      }}
      anchor={{ x: 0.5, y: 1 }}
      zIndex={selected ? 20 : availableToday ? 10 : 5}
    >
      <View style={styles.wrap} collapsable={false}>
        <View
          style={[
            styles.pin,
            {
              backgroundColor: fill,
              borderColor: '#FFFFFF',
              transform: [{ scale: selected ? 1.15 : 1 }],
            },
          ]}
        >
          <View style={styles.dot} />
        </View>
        <View style={[styles.stem, { borderTopColor: fill }]} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', width: 36, height: 42 },
  pin: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.28,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  stem: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
});
