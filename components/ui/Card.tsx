import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '@/theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padded?: boolean;
  elevated?: boolean;
  delay?: number;
}

export function Card({
  children,
  onPress,
  style,
  padded = true,
  elevated = true,
  delay = 0,
}: CardProps) {
  const { colors, radius, spacing, shadows } = useTheme();

  const content = (
    <Animated.View
      entering={FadeInDown.delay(delay).springify().damping(18)}
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          padding: padded ? spacing.lg : 0,
          overflow: 'hidden',
          ...(elevated ? shadows.md : shadows.sm),
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}>
        {content}
      </Pressable>
    );
  }

  return content;
}

export function Divider({ style }: { style?: ViewStyle }) {
  const { colors, spacing } = useTheme();
  return (
    <View
      style={[
        { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.md },
        style,
      ]}
    />
  );
}
