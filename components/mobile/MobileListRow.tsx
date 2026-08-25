import React from 'react';
import { Pressable, View } from 'react-native';
import { ChevronRight } from '@/components/icons';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';

interface MobileListRowProps {
  title: string;
  subtitle?: string;
  meta?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
}

export function MobileListRow({
  title,
  subtitle,
  meta,
  leading,
  trailing,
  onPress,
  showChevron = true,
}: MobileListRowProps) {
  const { colors, spacing, radius } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        backgroundColor: pressed && onPress ? colors.surfaceSoft : colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        minWidth: 0,
      })}
    >
      {leading}
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text variant="label" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" muted numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
        {meta ? (
          <Text variant="caption" color={colors.primary} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>
      {trailing}
      {showChevron && onPress ? (
        <ChevronRight size={16} color={colors.textMuted} strokeWidth={1.8} />
      ) : null}
    </Pressable>
  );
}
