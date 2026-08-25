import React, { useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/theme';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, radius, style }: SkeletonProps) {
  const { colors, radius: r } = useTheme();
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [opacity]);

  const anim = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width: width as number | `${number}%`,
          height,
          borderRadius: radius ?? r.md,
          backgroundColor: colors.skeleton,
        },
        anim,
        style,
      ]}
    />
  );
}

export function ClinicCardSkeleton() {
  const { spacing, radius } = useTheme();
  return (
    <View style={{ width: 280, gap: spacing.md }}>
      <Skeleton height={140} radius={radius.xl} />
      <Skeleton width="70%" height={18} />
      <Skeleton width="50%" height={14} />
      <Skeleton width="90%" height={14} />
    </View>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.lg, padding: spacing.lg }}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
          <Skeleton width={56} height={56} radius={28} />
          <View style={{ flex: 1, gap: spacing.sm }}>
            <Skeleton width="60%" height={16} />
            <Skeleton width="40%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}
