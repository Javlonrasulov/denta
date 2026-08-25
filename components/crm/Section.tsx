import React from 'react';
import { View, ViewStyle } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';

interface SectionProps {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
}

export function Section({ title, action, children, style, padded = true }: SectionProps) {
  const { colors, spacing, radius, shadows, isDark } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: isDark ? colors.surfaceElevated : colors.surface,
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: 'hidden',
          ...shadows.md,
        },
        style,
      ]}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderSubtle,
        }}
      >
        <Text variant="h3">{title}</Text>
        {action}
      </View>
      <View style={padded ? { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.md } : undefined}>
        {children}
      </View>
    </View>
  );
}
