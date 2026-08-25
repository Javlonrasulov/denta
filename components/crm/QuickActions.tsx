import React from 'react';
import { Pressable, View } from 'react-native';
import type { LucideIcon } from '@/components/icons';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';

interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  onPress?: () => void;
}

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  const { colors, spacing, radius, iconSizes, isDark } = useTheme();

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
      {actions.map((action, index) => {
        const Icon = action.icon;
        const primary = index === 0;
        return (
          <Pressable
            key={action.id}
            onPress={action.onPress}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              paddingVertical: spacing.sm + 2,
              paddingHorizontal: spacing.md,
              borderRadius: radius.full,
              backgroundColor: primary
                ? pressed
                  ? colors.primaryPressed
                  : colors.primary
                : pressed
                  ? colors.surfaceSoft
                  : isDark
                    ? colors.surfaceElevated
                    : colors.surface,
              borderWidth: primary ? 0 : 1,
              borderColor: colors.border,
              minHeight: 40,
            })}
          >
            <Icon
              size={iconSizes.xs}
              color={primary ? colors.textInverse : colors.primary}
              strokeWidth={2}
            />
            <Text
              variant="caption"
              weight="semibold"
              color={primary ? colors.textInverse : colors.text}
            >
              {action.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
