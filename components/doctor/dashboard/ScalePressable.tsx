import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ScalePressable({
  children,
  onPress,
  accessibilityLabel,
  style,
  disabled,
}: {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: object;
  disabled?: boolean;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPressIn={() => {
        if (disabled) return;
        scale.value = withSpring(0.97, { damping: 16, stiffness: 280 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 280 });
      }}
      onPress={() => {
        if (disabled) return;
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      style={[style, animStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}

export function DashboardHairline() {
  const { hairline } = useLoginTheme();
  return <View style={{ height: 1, backgroundColor: hairline }} />;
}
