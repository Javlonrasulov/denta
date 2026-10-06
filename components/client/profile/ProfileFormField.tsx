import { useState } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { Eye, EyeOff } from '@/components/icons';
import { Text } from '@/components/ui/Text';

export function ProfileFormField({
  label,
  value,
  onChangeText,
  secure,
  hint,
  ...inputProps
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secure?: boolean;
  hint?: string;
} & Omit<TextInputProps, 'value' | 'onChangeText' | 'secureTextEntry' | 'style'>) {
  const { colors, field, hairline } = useLoginTheme();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  return (
    <View style={{ gap: 6 }}>
      <Text variant="label" color={colors.textSecondary}>
        {label}
      </Text>
      <View
        style={{
          height: 50,
          borderRadius: 14,
          backgroundColor: field,
          borderWidth: 1,
          borderColor: focused ? colors.primary : hairline,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <TextInput
          {...inputProps}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure && !revealed}
          placeholderTextColor={colors.textMuted}
          onFocus={(e) => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
          style={{
            flex: 1,
            height: '100%',
            paddingHorizontal: 14,
            color: colors.text,
            fontFamily: 'GolosText_500Medium',
            fontSize: 15,
          }}
        />
        {secure ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setRevealed((v) => !v)}
            style={{ paddingHorizontal: 14, height: '100%', justifyContent: 'center' }}
          >
            {revealed ? (
              <EyeOff size={18} color={colors.textMuted} strokeWidth={1.8} />
            ) : (
              <Eye size={18} color={colors.textMuted} strokeWidth={1.8} />
            )}
          </Pressable>
        ) : null}
      </View>
      {hint ? (
        <Text variant="caption" color={colors.textMuted}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

export function ProfileChoiceGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
}) {
  const { colors, field, hairline, isDark } = useLoginTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text variant="label" color={colors.textSecondary}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {options.map((option) => {
          const active = option.value === value;
          return (
            <View
              key={option.value}
              style={{
                flex: 1,
                height: 50,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: active ? colors.primary : hairline,
                backgroundColor: active
                  ? isDark
                    ? 'rgba(129,140,248,0.18)'
                    : 'rgba(67,56,202,0.08)'
                  : field,
                overflow: 'hidden',
              }}
            >
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  void Haptics.selectionAsync();
                  onChange(option.value);
                }}
                style={{ width: '100%', height: '100%' }}
              >
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Text
                    style={{
                      fontFamily: 'GolosText_600SemiBold',
                      fontSize: 14,
                      color: active ? colors.primary : colors.text,
                    }}
                  >
                    {option.label}
                  </Text>
                </View>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
