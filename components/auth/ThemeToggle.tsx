import * as Haptics from 'expo-haptics';
import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Moon, Sun } from '@/components/icons';
import { useLoginTheme } from '@/components/auth/loginTheme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ThemeToggle({
  isDark,
  onToggle,
  accessibilityLabel,
}: {
  isDark: boolean;
  onToggle: () => void;
  accessibilityLabel?: string;
}) {
  const { colors, hairline, field } = useLoginTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 16, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 300 });
      }}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onToggle();
      }}
      style={[
        {
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: field,
          borderWidth: 1,
          borderColor: hairline,
        },
        animStyle,
      ]}
    >
      {isDark ? (
        <Sun size={16} color={colors.textSecondary} strokeWidth={1.8} />
      ) : (
        <Moon size={16} color={colors.textSecondary} strokeWidth={1.8} />
      )}
    </AnimatedPressable>
  );
}
