import React from 'react';
import { View } from 'react-native';

import { useTheme } from '@/theme';

type Tone = 'success' | 'warning' | 'error' | 'neutral' | 'info' | 'primary';

export function StatusDot({ tone = 'neutral' }: { tone?: Tone }) {
  const { colors } = useTheme();
  const map: Record<Tone, string> = {
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    neutral: colors.textMuted,
    info: colors.info,
    primary: colors.primary,
  };
  return (
    <View
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: map[tone],
      }}
    />
  );
}
