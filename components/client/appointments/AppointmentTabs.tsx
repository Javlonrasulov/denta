import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';
import type { AppointmentStatus } from '@/types';

type Props = {
  value: AppointmentStatus;
  onChange: (value: AppointmentStatus) => void;
  counts: Record<AppointmentStatus, number>;
};

const TABS: AppointmentStatus[] = ['upcoming', 'completed', 'cancelled'];

export function AppointmentTabs({ value, onChange, counts }: Props) {
  const { t } = useTranslation();
  const { colors, shadows, isDark } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: isDark ? colors.surfaceSoft : '#EEF2FF',
        borderRadius: 18,
        padding: 4,
        gap: 4,
      }}
    >
      {TABS.map((key) => (
        <TabPill
          key={key}
          active={value === key}
          label={t(`appointments.${key}`)}
          count={counts[key]}
          onPress={() => onChange(key)}
          activeBg={colors.surface}
          activeFg={colors.primary}
          inactiveFg={colors.textMuted}
          badgeBg={colors.primaryMuted}
          shadow={shadows.sm}
        />
      ))}
    </View>
  );
}

function TabPill({
  active,
  label,
  count,
  onPress,
  activeBg,
  activeFg,
  inactiveFg,
  badgeBg,
  shadow,
}: {
  active: boolean;
  label: string;
  count: number;
  onPress: () => void;
  activeBg: string;
  activeFg: string;
  inactiveFg: string;
  badgeBg: string;
  shadow: object;
}) {
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, { duration: 180 });
  }, [active, progress]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + progress.value * 0.45,
    transform: [{ scale: 0.98 + progress.value * 0.02 }],
  }));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={{ flex: 1 }}
    >
      <Animated.View
        style={[
          {
            minHeight: 48,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 6,
            paddingVertical: 8,
            gap: 2,
            backgroundColor: active ? activeBg : 'transparent',
          },
          active ? shadow : null,
          animStyle,
        ]}
      >
        <Text
          variant="label"
          color={active ? activeFg : inactiveFg}
          numberOfLines={2}
          center
          style={{ fontSize: 12, lineHeight: 15, letterSpacing: -0.2 }}
        >
          {label}
        </Text>
        <View
          style={{
            minWidth: 20,
            height: 18,
            borderRadius: 9,
            paddingHorizontal: 6,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: active ? badgeBg : 'transparent',
          }}
        >
          <Text
            variant="caption"
            color={active ? activeFg : inactiveFg}
            style={{ fontSize: 11, lineHeight: 14 }}
          >
            {count}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}
