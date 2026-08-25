import React from 'react';
import { View } from 'react-native';
import type { LucideIcon } from '@/components/icons';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';

interface MobileEmptyProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function MobileEmpty({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: MobileEmptyProps) {
  const { colors, spacing, radius } = useTheme();

  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing['4xl'],
        paddingHorizontal: spacing.xl,
        gap: spacing.md,
      }}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: radius.xl,
          backgroundColor: colors.primaryMuted,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.xs,
        }}
      >
        <Icon size={28} color={colors.primary} strokeWidth={1.75} />
      </View>
      <Text variant="h3" center>
        {title}
      </Text>
      {description ? (
        <Text variant="bodySmall" muted center style={{ maxWidth: 280 }}>
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: spacing.sm, minWidth: 160 }}>
          <Button title={actionLabel} onPress={onAction} size="sm" />
        </View>
      ) : null}
    </View>
  );
}
