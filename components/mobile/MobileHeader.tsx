import React from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';

interface MobileHeaderProps {
  title?: string;
  subtitle?: string;
  greeting?: string;
  large?: boolean;
  left?: React.ReactNode;
  right?: React.ReactNode;
  children?: React.ReactNode;
}

export function MobileHeader({
  title,
  subtitle,
  greeting,
  large,
  left,
  right,
  children,
}: MobileHeaderProps) {
  const { colors, spacing } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: large ? 'flex-start' : 'center',
        justifyContent: 'space-between',
        gap: spacing.md,
        marginBottom: spacing.lg,
        minWidth: 0,
      }}
    >
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        {left}
        {greeting ? (
          <Text variant="caption" muted numberOfLines={1}>
            {greeting}
          </Text>
        ) : null}
        {title ? (
          <Text
            variant={large ? 'display' : 'h2'}
            numberOfLines={2}
            style={large ? { fontSize: 28, lineHeight: 34, letterSpacing: -0.5 } : undefined}
          >
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text variant="bodySmall" color={colors.textSecondary} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
        {children}
      </View>
      {right ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 0 }}>
          {right}
        </View>
      ) : null}
    </View>
  );
}

export function MobileIconButton({
  children,
  onPress,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const { colors, radius } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => ({
        width: 40,
        height: 40,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed ? colors.surfaceSoft : colors.surface,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
      })}
    >
      {children}
    </Pressable>
  );
}
