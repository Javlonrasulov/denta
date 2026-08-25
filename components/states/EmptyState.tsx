import React from 'react';
import { View } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { colors, spacing, radius } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing['3xl'],
        gap: spacing.md,
      }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: radius.full,
          backgroundColor: colors.primaryMuted,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.sm,
        }}
      >
        <Icon size={32} color={colors.primary} strokeWidth={1.75} />
      </View>
      <Text variant="h3" center>
        {title}
      </Text>
      {description ? (
        <Text variant="body" muted center>
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: spacing.md, width: '100%' }}>
          <Button title={actionLabel} onPress={onAction} fullWidth />
        </View>
      ) : null}
    </View>
  );
}

interface ErrorStateProps {
  title: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({ title, description, onRetry, retryLabel }: ErrorStateProps) {
  const { colors, spacing } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing['3xl'],
        gap: spacing.md,
      }}
    >
      <Text variant="h3" center color={colors.error}>
        {title}
      </Text>
      {description ? (
        <Text variant="body" muted center>
          {description}
        </Text>
      ) : null}
      {onRetry ? (
        <Button title={retryLabel ?? 'Retry'} onPress={onRetry} variant="outline" />
      ) : null}
    </View>
  );
}
