import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';
import type { AppointmentStatus } from '@/types';

type Counts = Record<AppointmentStatus, number>;

type Props = {
  counts: Counts;
  active: AppointmentStatus;
  onSelect: (status: AppointmentStatus) => void;
};

const ITEMS: {
  key: AppointmentStatus;
  labelKey: string;
  accent: 'primary' | 'success' | 'muted';
}[] = [
  { key: 'upcoming', labelKey: 'appointments.summary_upcoming', accent: 'primary' },
  { key: 'completed', labelKey: 'appointments.summary_completed', accent: 'success' },
  { key: 'cancelled', labelKey: 'appointments.summary_cancelled', accent: 'muted' },
];

export function AppointmentSummary({ counts, active, onSelect }: Props) {
  const { t } = useTranslation();
  const { colors, spacing, radius, shadows, isDark } = useTheme();

  const accentFor = (accent: (typeof ITEMS)[number]['accent']) => {
    if (accent === 'primary') {
      return {
        bg: isDark ? colors.primaryMuted : '#EEF2FF',
        fg: colors.primary,
        ring: colors.primary,
      };
    }
    if (accent === 'success') {
      return {
        bg: isDark ? colors.successMuted : '#F0FDF4',
        fg: colors.success,
        ring: colors.success,
      };
    }
    return {
      bg: isDark ? colors.surfaceSoft : '#FFF1F2',
      fg: isDark ? colors.error : '#E11D48',
      ring: isDark ? colors.error : '#FB7185',
    };
  };

  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      {ITEMS.map((item) => {
        const selected = active === item.key;
        const tone = accentFor(item.accent);
        return (
          <Pressable
            key={item.key}
            onPress={() => onSelect(item.key)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={[
              {
                flex: 1,
                minHeight: 72,
                borderRadius: radius.xl,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.md,
                backgroundColor: colors.surface,
                borderWidth: 1.5,
                borderColor: selected ? tone.ring : colors.borderSubtle,
                gap: 4,
              },
              selected ? shadows.sm : null,
            ]}
          >
            <View
              style={{
                alignSelf: 'flex-start',
                minWidth: 28,
                height: 28,
                borderRadius: 10,
                paddingHorizontal: 8,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: tone.bg,
              }}
            >
              <Text variant="label" color={tone.fg} style={{ fontSize: 14 }}>
                {counts[item.key]}
              </Text>
            </View>
            <Text
              variant="caption"
              color={selected ? colors.text : colors.textMuted}
              numberOfLines={2}
              style={{ fontSize: 11, lineHeight: 14, letterSpacing: -0.1 }}
            >
              {t(item.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
