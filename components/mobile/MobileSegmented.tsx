import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';

interface MobileSegmentedProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function MobileSegmented<T extends string>({
  options,
  value,
  onChange,
}: MobileSegmentedProps<T>) {
  const { colors, spacing, radius } = useTheme();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: colors.surfaceSoft,
          borderRadius: radius.lg,
          padding: 3,
          alignSelf: 'flex-start',
        }}
      >
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              style={{
                paddingHorizontal: spacing.lg,
                paddingVertical: 10,
                borderRadius: radius.md,
                backgroundColor: active ? colors.surface : 'transparent',
                minHeight: 36,
                justifyContent: 'center',
                ...(active
                  ? {
                      shadowColor: '#0A0F1A',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.06,
                      shadowRadius: 2,
                      elevation: 1,
                    }
                  : null),
              }}
            >
              <Text
                variant="caption"
                weight="semibold"
                color={active ? colors.text : colors.textMuted}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
