import React, { useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

function SkeletonRow() {
  const { spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
      <Skeleton width={48} height={48} radius={16} />
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton width="68%" height={14} />
        <Skeleton width="42%" height={11} />
      </View>
      <Skeleton width={56} height={18} radius={9} />
    </View>
  );
}

export function ListSkeleton({
  rows = 8,
  fullPage = false,
}: {
  rows?: number;
  fullPage?: boolean;
}) {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingHorizontal: spacing.xl,
        paddingTop: fullPage ? insets.top + 16 : spacing.lg,
        paddingBottom: spacing['3xl'],
        gap: 18,
      }}
    >
      {fullPage ? (
        <>
          <View style={{ gap: 10 }}>
            <Skeleton width="36%" height={22} />
            <Skeleton width="52%" height={13} />
          </View>
          <Skeleton height={48} radius={16} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Skeleton height={76} radius={18} style={{ flex: 1 }} />
            <Skeleton height={76} radius={18} style={{ flex: 1 }} />
          </View>
        </>
      ) : null}
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </View>
  );
}
