import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';
import type { LucideIcon } from '@/components/icons';

export type AppointmentAction = {
  key: string;
  label: string;
  onPress: () => void;
  tone?: 'default' | 'primary' | 'danger' | 'muted';
  icon?: LucideIcon;
  loading?: boolean;
};

type Props = {
  actions: AppointmentAction[];
};

export function AppointmentActionRow({ actions }: Props) {
  const { colors, spacing, radius } = useTheme();

  if (actions.length === 0) return null;

  const toneStyle = (tone: AppointmentAction['tone'] = 'default') => {
    switch (tone) {
      case 'primary':
        return {
          bg: colors.primary,
          fg: colors.textInverse,
          border: colors.primary,
        };
      case 'danger':
        return {
          bg: colors.errorMuted,
          fg: colors.error,
          border: 'transparent',
        };
      case 'muted':
        return {
          bg: colors.surfaceSoft,
          fg: colors.textSecondary,
          border: 'transparent',
        };
      default:
        return {
          bg: colors.surface,
          fg: colors.text,
          border: colors.border,
        };
    }
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginTop: spacing.xs,
      }}
    >
      {actions.map((action) => {
        const tone = toneStyle(action.tone);
        const Icon = action.icon;
        return (
          <Pressable
            key={action.key}
            onPress={action.onPress}
            disabled={action.loading}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            hitSlop={4}
            style={({ pressed }) => ({
              flexGrow: 1,
              flexBasis: actions.length > 2 ? '46%' : '30%',
              minHeight: 40,
              borderRadius: radius.lg,
              paddingHorizontal: spacing.md,
              paddingVertical: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              backgroundColor: tone.bg,
              borderWidth: tone.border === 'transparent' ? 0 : 1,
              borderColor: tone.border,
              opacity: pressed || action.loading ? 0.85 : 1,
            })}
          >
            {Icon ? <Icon size={14} color={tone.fg} strokeWidth={2} /> : null}
            <Text
              variant="label"
              color={tone.fg}
              numberOfLines={1}
              style={{ fontSize: 12, letterSpacing: -0.1 }}
            >
              {action.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
