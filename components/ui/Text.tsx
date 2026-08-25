import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';

import { useTheme } from '@/theme';
import { typography } from '@/theme/tokens';

type Variant = keyof typeof typography;

interface TextProps extends RNTextProps {
  variant?: Variant;
  color?: string;
  muted?: boolean;
  center?: boolean;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
}

export function Text({
  variant = 'body',
  color,
  muted,
  center,
  weight,
  style,
  children,
  ...rest
}: TextProps) {
  const { colors, typography: type, fontWeight } = useTheme();
  const token = type[variant];

  const family =
    weight === 'bold'
      ? fontWeight.bold
      : weight === 'semibold'
        ? fontWeight.semibold
        : weight === 'medium'
          ? fontWeight.medium
          : weight === 'regular'
            ? fontWeight.regular
            : token.fontFamily;

  return (
    <RNText
      {...rest}
      style={[
        {
          fontSize: token.fontSize,
          lineHeight: token.lineHeight,
          letterSpacing: token.letterSpacing,
          fontFamily: family,
          color: color ?? (muted ? colors.textMuted : colors.text),
          textAlign: center ? 'center' : undefined,
        },
        style,
      ]}
    >
      {children}
    </RNText>
  );
}

export const textStyles = StyleSheet.create({});
