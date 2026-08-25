import React from 'react';
import { ScrollView, View, ViewStyle, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

interface MobileScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: { top?: boolean; bottom?: boolean };
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: ViewStyle;
  style?: ViewStyle;
}

export function MobileScreen({
  children,
  scroll = true,
  padded = true,
  edges = { top: true, bottom: false },
  refreshing,
  onRefresh,
  contentStyle,
  style,
}: MobileScreenProps) {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const padH = padded ? spacing.xl : 0;

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: edges.top ? insets.top : 0,
    ...style,
  };

  if (!scroll) {
    return (
      <View
        style={[
          containerStyle,
          {
            paddingHorizontal: padH,
            paddingBottom: edges.bottom ? insets.bottom + spacing.lg : 0,
          },
          contentStyle,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          {
            paddingHorizontal: padH,
            paddingTop: spacing.md,
            paddingBottom: (edges.bottom ? insets.bottom : 0) + spacing['5xl'],
            flexGrow: 1,
          },
          contentStyle,
        ]}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={!!refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
    </View>
  );
}
