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

export type FavoritesTab = 'clinics' | 'doctors';

type Props = {
  value: FavoritesTab;
  onChange: (tab: FavoritesTab) => void;
  counts: { clinics: number; doctors: number };
};

export function FavoritesSegmented({ value, onChange, counts }: Props) {
  const { t } = useTranslation();
  const { colors, shadows, isDark } = useTheme();

  const options: { value: FavoritesTab; label: string; count: number }[] = [
    { value: 'clinics', label: t('favorites.clinics'), count: counts.clinics },
    { value: 'doctors', label: t('favorites.doctors'), count: counts.doctors },
  ];

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: isDark ? colors.surfaceSoft : '#EEF2FF',
        borderRadius: 18,
        padding: 4,
        gap: 4,
        borderWidth: 1,
        borderColor: isDark ? colors.borderSubtle : 'rgba(67,56,202,0.06)',
      }}
    >
      {options.map((opt) => (
        <SegmentPill
          key={opt.value}
          active={opt.value === value}
          label={opt.label}
          count={opt.count}
          onPress={() => onChange(opt.value)}
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

function SegmentPill({
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
    opacity: 0.62 + progress.value * 0.38,
    transform: [{ scale: 0.985 + progress.value * 0.015 }],
  }));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={{ flex: 1, minWidth: 0 }}
    >
      <Animated.View
        style={[
          {
            minHeight: 44,
            borderRadius: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 8,
            paddingVertical: 8,
            gap: 6,
            backgroundColor: active ? activeBg : 'transparent',
          },
          active ? shadow : null,
          animStyle,
        ]}
      >
        <Text
          variant="label"
          color={active ? activeFg : inactiveFg}
          numberOfLines={1}
          style={{ fontSize: 13, lineHeight: 16, letterSpacing: -0.15, flexShrink: 1 }}
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
