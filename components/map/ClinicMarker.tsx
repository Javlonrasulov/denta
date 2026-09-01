import { Marker } from 'react-native-maps';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';

type Props = {
  id: string;
  coordinate: { latitude: number; longitude: number };
  rating: number;
  selected?: boolean;
  availableToday?: boolean;
  onPress?: (id: string) => void;
};

export function ClinicMarker({
  id,
  coordinate,
  rating,
  selected,
  availableToday,
  onPress,
}: Props) {
  const { colors, shadows, radius } = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const bg = selected
    ? colors.warning
    : availableToday
      ? colors.secondary
      : colors.primary;

  return (
    <Marker
      coordinate={coordinate}
      tracksViewChanges={false}
      onPress={() => {
        void Haptics.selectionAsync();
        scale.value = withSpring(1.12, { damping: 12 });
        setTimeout(() => {
          scale.value = withSpring(1);
        }, 180);
        onPress?.(id);
      }}
      anchor={{ x: 0.5, y: 1 }}
    >
      <Animated.View style={animStyle}>
        <View
          style={[
            styles.pill,
            shadows.md,
            {
              backgroundColor: bg,
              borderRadius: radius.full,
              borderColor: colors.surface,
            },
          ]}
        >
          <Text
            variant="caption"
            style={{ color: colors.textInverse, fontWeight: '700' }}
          >
            {rating.toFixed(1)} ★
          </Text>
        </View>
        <View style={[styles.stem, { borderTopColor: bg }]} />
      </Animated.View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 2,
    minWidth: 52,
    alignItems: 'center',
  },
  stem: {
    alignSelf: 'center',
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
});
