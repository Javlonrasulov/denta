import React from 'react';
import { View } from 'react-native';
import type { LucideIcon } from '@/components/icons';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';

export interface MobileStat {
  id: string;
  label: string;
  value: string;
  icon?: LucideIcon;
}

interface MobileStatRowProps {
  stats: MobileStat[];
}

export function MobileStatRow({ stats }: MobileStatRowProps) {
  const { colors, spacing, radius } = useTheme();

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <View
            key={stat.id}
            style={{
              flexGrow: 1,
              flexBasis: '46%',
              minWidth: '46%',
              maxWidth: '100%',
              backgroundColor: colors.surface,
              borderRadius: radius.xl,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              padding: spacing.lg,
              gap: spacing.sm,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: spacing.sm,
              }}
            >
              <Text
                variant="caption"
                color={colors.textMuted}
                numberOfLines={1}
                style={{ flex: 1, textTransform: 'uppercase', letterSpacing: 0.4, fontSize: 11 }}
              >
                {stat.label}
              </Text>
              {Icon ? (
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: radius.sm,
                    backgroundColor: colors.primaryMuted,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={14} color={colors.primary} strokeWidth={2} />
                </View>
              ) : null}
            </View>
            <Text variant="h2" style={{ fontSize: 22, lineHeight: 28, letterSpacing: -0.4 }}>
              {stat.value}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
