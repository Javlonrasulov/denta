import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import type { LucideIcon } from '@/components/icons';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';

interface MobileQuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  onPress?: () => void;
  primary?: boolean;
}

export function MobileQuickActions({ actions }: { actions: MobileQuickAction[] }) {
  const { colors, spacing, radius } = useTheme();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {actions.map((action, index) => {
          const Icon = action.icon;
          const primary = action.primary ?? index === 0;
          return (
            <Pressable
              key={action.id}
              onPress={action.onPress}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                paddingVertical: 10,
                paddingHorizontal: spacing.lg,
                borderRadius: radius.full,
                backgroundColor: primary
                  ? pressed
                    ? colors.primaryPressed
                    : colors.primary
                  : pressed
                    ? colors.surfaceSoft
                    : colors.surface,
                borderWidth: primary ? 0 : 1,
                borderColor: colors.borderSubtle,
                minHeight: 40,
              })}
            >
              <Icon
                size={16}
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
    </ScrollView>
  );
}
