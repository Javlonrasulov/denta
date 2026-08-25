import React from 'react';
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  Pressable,
} from 'react-native';
import { Search, X } from 'lucide-react-native';

import { Text } from './Text';
import { useTheme } from '@/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  size = 'md',
  style,
  ...rest
}: InputProps) {
  const { colors, radius, inputSizes, spacing, typography } = useTheme();
  const height = inputSizes[size].height;

  return (
    <View style={{ gap: spacing.xs }}>
      {label ? (
        <Text variant="label" color={colors.textSecondary}>
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.field,
          {
            height,
            borderRadius: radius.md,
            backgroundColor: colors.surfaceSoft,
            borderColor: error ? colors.error : colors.border,
            borderWidth: error ? 1.5 : 1,
            paddingHorizontal: spacing.lg,
          },
        ]}
      >
        {leftIcon}
        <TextInput
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            {
              fontFamily: typography.body.fontFamily,
              fontSize: inputSizes[size].fontSize,
              color: colors.text,
              marginLeft: leftIcon ? spacing.sm : 0,
              marginRight: rightIcon ? spacing.sm : 0,
            },
            style,
          ]}
          {...rest}
        />
        {rightIcon}
      </View>
      {error ? (
        <Text variant="caption" color={colors.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  onFocus?: () => void;
}

export function SearchInput({
  value,
  onChangeText,
  placeholder,
  onClear,
  onFocus,
}: SearchInputProps) {
  const { colors, radius, spacing, iconSizes } = useTheme();

  return (
    <View
      style={[
        styles.field,
        {
          height: 52,
          borderRadius: radius.lg,
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          paddingHorizontal: spacing.lg,
        },
      ]}
    >
      <Search size={iconSizes.md} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, { color: colors.text, marginLeft: spacing.sm, fontSize: 15 }]}
        returnKeyType="search"
        accessibilityLabel={placeholder}
      />
      {value.length > 0 ? (
        <Pressable
          onPress={onClear}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Clear"
        >
          <X size={iconSizes.sm} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingVertical: 0,
  },
});
