import React from 'react';
import { View } from 'react-native';
import type { LucideIcon } from '@/components/icons';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';

interface KpiStatProps {
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  comparison?: string;
  icon: LucideIcon;
}

export function KpiStat({ label, value, trend, trendUp, comparison, icon: Icon }: KpiStatProps) {
  const { colors, spacing, radius, iconSizes, shadows, isDark } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        minWidth: 160,
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.lg,
        gap: spacing.sm,
        overflow: 'hidden',
        ...shadows.md,
      }}
    >
      {/* Accent rail — premium hierarchy cue */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          backgroundColor: colors.secondary,
          opacity: isDark ? 0.9 : 0.85,
        }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="caption" color={colors.textSecondary} style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>
          {label}
        </Text>
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: radius.md,
            backgroundColor: isDark ? colors.accentGlow : colors.primaryMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={iconSizes.sm} color={colors.primary} strokeWidth={2} />
        </View>
      </View>
      <Text variant="kpi">{value}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}>
        {trend ? (
          <View
            style={{
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: radius.sm,
              backgroundColor: trendUp === false ? colors.errorMuted : colors.successMuted,
            }}
          >
            <Text
              variant="caption"
              color={trendUp === false ? colors.error : colors.success}
              weight="semibold"
            >
              {trend}
            </Text>
          </View>
        ) : null}
        {comparison ? (
          <Text variant="caption" muted>
            {comparison}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
