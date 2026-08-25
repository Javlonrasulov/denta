import React from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import { ChevronRight } from '@/components/icons';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';

interface MobileSectionProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function MobileSection({
  title,
  actionLabel,
  onAction,
  children,
  style,
}: MobileSectionProps) {
  const { colors, spacing } = useTheme();

  return (
    <View style={[{ gap: spacing.md, marginBottom: spacing.xl }, style]}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.md,
        }}
      >
        <Text variant="h3" style={{ flex: 1, letterSpacing: -0.2 }} numberOfLines={1}>
          {title}
        </Text>
        {actionLabel && onAction ? (
          <Pressable
            onPress={onAction}
            hitSlop={8}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
          >
            <Text variant="caption" weight="semibold" color={colors.primary}>
              {actionLabel}
            </Text>
            <ChevronRight size={14} color={colors.primary} strokeWidth={2} />
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}
