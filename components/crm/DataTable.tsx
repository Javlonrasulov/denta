import React from 'react';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';
import { layout } from '@/theme/tokens';

export interface DataColumn<T> {
  key: string;
  title: string;
  flex?: number;
  render: (row: T) => React.ReactNode;
  mobilePrimary?: boolean;
}

interface DataTableProps<T> {
  columns: DataColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onRowPress?: (row: T) => void;
}

export function DataTable<T>({ columns, data, keyExtractor, onRowPress }: DataTableProps<T>) {
  const { colors, spacing, radius } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < layout.breakpointTablet;

  if (isMobile) {
    return (
      <View style={{ gap: spacing.sm }}>
        {data.map((row) => (
          <Pressable
            key={keyExtractor(row)}
            onPress={() => onRowPress?.(row)}
            style={{
              padding: spacing.md,
              borderRadius: radius.md,
              backgroundColor: colors.surfaceSoft,
              gap: spacing.xs,
            }}
          >
            {columns.map((col) => (
              <View key={col.key} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
                <Text variant="caption" muted>
                  {col.title}
                </Text>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>{col.render(row)}</View>
              </View>
            ))}
          </Pressable>
        ))}
      </View>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ minWidth: '100%', flex: 1 }}>
        <View
          style={{
            flexDirection: 'row',
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: colors.borderSubtle,
            gap: spacing.md,
          }}
        >
          {columns.map((col) => (
            <View key={col.key} style={{ flex: col.flex ?? 1, minWidth: 100 }}>
              <Text variant="caption" muted>
                {col.title}
              </Text>
            </View>
          ))}
        </View>
        {data.map((row) => (
          <Pressable
            key={keyExtractor(row)}
            onPress={() => onRowPress?.(row)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: colors.borderSubtle,
              gap: spacing.md,
              backgroundColor: pressed ? colors.surfaceSoft : 'transparent',
              alignItems: 'center',
              minHeight: 48,
            })}
          >
            {columns.map((col) => (
              <View key={col.key} style={{ flex: col.flex ?? 1, minWidth: 100 }}>
                {col.render(row)}
              </View>
            ))}
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
