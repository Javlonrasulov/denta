import { type ReactNode, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { Text } from '@/components/ui/Text';

const webInputReset =
  Platform.OS === 'web'
    ? ({
        outlineStyle: 'none',
        outlineWidth: 0,
        boxShadow: 'none',
      } as const)
    : null;

type AuthFieldProps = TextInputProps & {
  label: string;
  error?: string;
  helperText?: string;
  helperTone?: 'muted' | 'success' | 'error';
  statusTone?: 'default' | 'success' | 'error';
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export function AuthField({
  label,
  error,
  helperText,
  helperTone = 'muted',
  statusTone = 'default',
  leftIcon,
  rightIcon,
  onFocus,
  onBlur,
  ...rest
}: AuthFieldProps) {
  const { colors, field, fieldFocus, hairline } = useLoginTheme();
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const toneBorder =
    statusTone === 'success'
      ? colors.success
      : statusTone === 'error' || error
        ? colors.error
        : focused
          ? colors.primary
          : hairline;
  const borderColor = error && statusTone === 'default' ? colors.error : toneBorder;
  const backgroundColor = focused || error || statusTone !== 'default' ? fieldFocus : field;

  const focusInput = () => {
    inputRef.current?.focus();
  };

  const helperColor =
    helperTone === 'success'
      ? colors.success
      : helperTone === 'error'
        ? colors.error
        : colors.textMuted;

  return (
    <View style={{ gap: 8 }}>
      <Text
        style={{
          fontFamily: 'GolosText_500Medium',
          fontSize: 13,
          lineHeight: 18,
          color: colors.textSecondary,
        }}
      >
        {label}
      </Text>
      <Pressable
        onPress={focusInput}
        style={{
          height: 56,
          borderRadius: 14,
          backgroundColor,
          borderWidth: focused || error || statusTone !== 'default' ? 1.5 : 1,
          borderColor,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          ...(focused && !error && statusTone === 'default'
            ? {
                shadowColor: colors.primary,
                shadowOpacity: 0.16,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 0 },
              }
            : null),
        }}
      >
        {leftIcon}
        <TextInput
          ref={inputRef}
          placeholderTextColor={colors.textMuted}
          underlineColorAndroid="transparent"
          showSoftInputOnFocus
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            styles.input,
            webInputReset as object,
            {
              fontSize: 16,
              color: colors.text,
              ...(Platform.OS === 'ios'
                ? { fontFamily: 'GolosText_500Medium', lineHeight: 22 }
                : { textAlignVertical: 'center' as const }),
            },
          ]}
          {...rest}
        />
        {rightIcon}
      </Pressable>
      {error ? (
        <Text
          style={{
            fontFamily: 'GolosText_400Regular',
            fontSize: 12,
            lineHeight: 16,
            color: colors.error,
          }}
        >
          {error}
        </Text>
      ) : helperText ? (
        <Text
          style={{
            fontFamily: 'GolosText_400Regular',
            fontSize: 12,
            lineHeight: 16,
            color: helperColor,
          }}
        >
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: Platform.OS === 'android' ? 12 : 0,
    margin: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
});
