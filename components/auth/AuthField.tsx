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
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export function AuthField({
  label,
  error,
  leftIcon,
  rightIcon,
  onFocus,
  onBlur,
  ...rest
}: AuthFieldProps) {
  const { colors, field, fieldFocus, hairline } = useLoginTheme();
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const borderColor = error ? colors.error : focused ? colors.primary : hairline;
  const backgroundColor = focused || error ? fieldFocus : field;

  const focusInput = () => {
    inputRef.current?.focus();
  };

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
          borderWidth: focused || error ? 1.5 : 1,
          borderColor,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          ...(focused && !error
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
