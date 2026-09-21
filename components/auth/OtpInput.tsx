import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { Text } from '@/components/ui/Text';

export function OtpInput({
  value,
  onChange,
  disabled,
  error,
  autoFocus,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
}) {
  const { colors, field, fieldFocus, hairline } = useLoginTheme();
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? '');
  const refs = useRef<(TextInput | null)[]>([]);
  const [focused, setFocused] = useState(-1);

  useEffect(() => {
    if (autoFocus) {
      const t = setTimeout(() => refs.current[0]?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [autoFocus]);

  const setAt = (index: number, char: string) => {
    const next = digits.slice();
    next[index] = char;
    onChange(next.join('').slice(0, 6));
  };

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
      {digits.map((d, i) => {
        const isFocused = focused === i;
        const borderColor = error
          ? colors.error
          : isFocused
            ? colors.primary
            : hairline;
        return (
          <TextInput
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={d}
            editable={!disabled}
            keyboardType="number-pad"
            textContentType={i === 0 ? 'oneTimeCode' : 'none'}
            autoComplete={i === 0 ? 'sms-otp' : 'off'}
            maxLength={6}
            selectTextOnFocus
            accessibilityLabel={`OTP ${i + 1}`}
            onFocus={() => setFocused(i)}
            onBlur={() => setFocused(-1)}
            onChangeText={(raw) => {
              const cleaned = raw.replace(/\D/g, '');
              if (cleaned.length > 1) {
                onChange(cleaned.slice(0, 6));
                const focusIdx = Math.min(cleaned.length, 5);
                refs.current[focusIdx]?.focus();
                return;
              }
              const char = cleaned.slice(-1);
              setAt(i, char);
              if (char && i < 5) refs.current[i + 1]?.focus();
            }}
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === 'Backspace' && !digits[i] && i > 0) {
                setAt(i - 1, '');
                refs.current[i - 1]?.focus();
              }
            }}
            style={{
              width: 48,
              height: 56,
              borderRadius: 14,
              borderWidth: error || isFocused ? 1.5 : 1,
              borderColor,
              backgroundColor: isFocused || error ? fieldFocus : field,
              textAlign: 'center',
              fontFamily: 'Geologica_700Bold',
              fontSize: 22,
              color: colors.text,
            }}
          />
        );
      })}
    </View>
  );
}

/** Invisible single-field fallback for paste on Android */
export function OtpHiddenPaste({
  onPaste,
}: {
  onPaste: (code: string) => void;
} & Pick<TextInputProps, never>) {
  return (
    <Pressable style={{ height: 0, overflow: 'hidden' }}>
      <TextInput
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        onChangeText={(v) => {
          const code = v.replace(/\D/g, '').slice(0, 6);
          if (code.length === 6) onPaste(code);
        }}
      />
    </Pressable>
  );
}
