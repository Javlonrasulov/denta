import { ActivityIndicator, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { Text } from '@/components/ui/Text';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PrimaryButton({
  title,
  onPress,
  loading,
  disabled,
}: {
  title: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const { cta, ctaText } = useLoginTheme();
  const scale = useSharedValue(1);
  const isDisabled = Boolean(disabled || loading);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={isDisabled}
      onPressIn={() => {
        if (isDisabled) return;
        scale.value = withSpring(0.97, { damping: 16, stiffness: 280 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 280 });
      }}
      onPress={() => {
        if (isDisabled) return;
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress?.();
      }}
      style={[
        {
          opacity: isDisabled && !loading ? 0.48 : 1,
          borderRadius: 16,
          overflow: 'hidden',
        },
        animStyle,
      ]}
    >
      <LinearGradient
        colors={cta}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          height: 56,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {loading ? (
          <ActivityIndicator color={ctaText} />
        ) : (
          <Text
            maxFontSizeMultiplier={1.15}
            style={{
              fontFamily: 'Geologica_600SemiBold',
              fontSize: 16,
              lineHeight: 24,
              color: ctaText,
              paddingHorizontal: 16,
            }}
          >
            {`${title}\u00A0`}
          </Text>
        )}
      </LinearGradient>
    </AnimatedPressable>
  );
}
