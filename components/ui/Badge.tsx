import React from 'react';
import { View, ViewStyle } from 'react-native';

import { Text } from './Text';
import { useTheme } from '@/theme';

type Tone = 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'secondary';

interface BadgeProps {
  label: string;
  tone?: Tone;
  style?: ViewStyle;
}

export function Badge({ label, tone = 'neutral', style }: BadgeProps) {
  const { colors, radius, spacing } = useTheme();

  const map: Record<Tone, { bg: string; fg: string }> = {
    primary: { bg: colors.primaryMuted, fg: colors.primary },
    secondary: { bg: colors.secondaryMuted, fg: colors.secondary },
    success: { bg: colors.successMuted, fg: colors.success },
    warning: { bg: colors.warningMuted, fg: colors.warning },
    error: { bg: colors.errorMuted, fg: colors.error },
    neutral: { bg: colors.surfaceSoft, fg: colors.textSecondary },
  };

  const c = map[tone];

  return (
    <View
      style={[
        {
          alignSelf: 'flex-start',
          backgroundColor: c.bg,
          paddingHorizontal: spacing.sm + 2,
          paddingVertical: spacing.xs,
          borderRadius: radius.full,
        },
        style,
      ]}
    >
      <Text variant="caption" color={c.fg}>
        {label}
      </Text>
    </View>
  );
}
