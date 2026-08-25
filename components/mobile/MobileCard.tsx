import React from 'react';
import { Pressable, View, ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

interface MobileCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  padded?: boolean;
  style?: ViewStyle;
}

export function MobileCard({ children, onPress, padded = true, style }: MobileCardProps) {
  const { colors, spacing, radius, shadows } = useTheme();

  const base: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: padded ? spacing.lg : 0,
    overflow: 'hidden',
    ...shadows.sm,
    ...style,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [base, { opacity: pressed ? 0.92 : 1 }]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={base}>{children}</View>;
}
