import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
  TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useTheme } from '@/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  fullWidth,
  leftIcon,
  style,
  textStyle,
  accessibilityLabel,
}: ButtonProps) {
  const { colors, buttonSizes, radius, fontWeight } = useTheme();
  const scale = useSharedValue(1);
  const sizeToken = buttonSizes[size];
  const isDisabled = disabled || loading;

  const palette: Record<Variant, { bg: string; text: string; border?: string }> = {
    primary: { bg: colors.primary, text: colors.textInverse },
    secondary: { bg: colors.secondaryMuted, text: colors.secondary },
    ghost: { bg: 'transparent', text: colors.primary },
    danger: { bg: colors.error, text: colors.textInverse },
    outline: { bg: 'transparent', text: colors.text, border: colors.border },
  };

  const scheme = palette[variant];

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      disabled={isDisabled}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      style={[
        styles.base,
        {
          height: sizeToken.height,
          paddingHorizontal: sizeToken.paddingHorizontal,
          borderRadius: radius.full,
          backgroundColor: scheme.bg,
          borderWidth: scheme.border ? 1 : 0,
          borderColor: scheme.border,
          opacity: isDisabled ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'auto',
          width: fullWidth ? '100%' : undefined,
        },
        animStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={scheme.text} />
      ) : (
        <>
          {leftIcon}
          <Text
            style={[
              {
                color: scheme.text,
                fontSize: sizeToken.fontSize,
                fontFamily: fontWeight.semibold,
                marginLeft: leftIcon ? 8 : 0,
                letterSpacing: -0.1,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
  },
});
