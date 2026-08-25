import React from 'react';
import { Pressable, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';

export interface TimelineItem {
  id: string;
  time: string;
  title: string;
  subtitle?: string;
  meta?: string;
  status?: string;
  statusTone?: 'success' | 'warning' | 'error' | 'neutral' | 'primary';
  available?: boolean;
}

interface TimelineProps {
  items: TimelineItem[];
  onPressItem?: (item: TimelineItem) => void;
}

export function Timeline({ items, onPressItem }: TimelineProps) {
  const { colors, spacing, radius } = useTheme();

  return (
    <View style={{ gap: 0 }}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <Pressable
            key={item.id}
            onPress={() => onPressItem?.(item)}
            disabled={item.available}
            style={{ flexDirection: 'row', gap: spacing.md, minHeight: 56 }}
          >
            <View style={{ width: 48, alignItems: 'flex-end', paddingTop: 2 }}>
              <Text variant="label" color={colors.primary} style={{ fontSize: 12 }}>
                {item.time}
              </Text>
            </View>
            <View style={{ alignItems: 'center', width: 16 }}>
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: item.available ? colors.border : colors.primary,
                  marginTop: 4,
                  borderWidth: 2,
                  borderColor: item.available ? colors.border : colors.primaryMuted,
                }}
              />
              {!isLast ? (
                <View style={{ flex: 1, width: 2, backgroundColor: colors.borderSubtle, marginVertical: 4 }} />
              ) : null}
            </View>
            <View
              style={{
                flex: 1,
                paddingBottom: spacing.md,
                paddingTop: 0,
              }}
            >
              {item.available ? (
                <View
                  style={{
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.md,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderStyle: 'dashed',
                    borderColor: colors.border,
                    backgroundColor: colors.surfaceSoft,
                  }}
                >
                  <Text variant="caption" muted>
                    {item.title}
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
                    <Text variant="label" numberOfLines={1} style={{ flex: 1 }}>
                      {item.title}
                    </Text>
                    {item.status ? <Badge label={item.status} tone={item.statusTone ?? 'neutral'} /> : null}
                  </View>
                  {item.subtitle ? (
                    <Text variant="caption" muted numberOfLines={1}>
                      {item.subtitle}
                    </Text>
                  ) : null}
                  {item.meta ? (
                    <Text variant="caption" color={colors.textSecondary} numberOfLines={1}>
                      {item.meta}
                    </Text>
                  ) : null}
                </View>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
