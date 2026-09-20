import { useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { Search, X } from '@/components/icons';

export function PatientSearch({
  value,
  onChangeText,
  onClear,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
}) {
  const { t } = useTranslation();
  const { colors, field, fieldFocus, hairline, isDark } = useLoginTheme();
  const [focused, setFocused] = useState(false);
  const focusAnim = useSharedValue(0);

  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + focusAnim.value * 0.008 }],
  }));

  return (
    <Animated.View
      style={[
        styles.field,
        {
          height: 48,
          borderRadius: 16,
          borderWidth: 1,
          paddingHorizontal: 14,
          backgroundColor: focused ? fieldFocus : field,
          borderColor: focused ? colors.primary : hairline,
        },
        anim,
      ]}
    >
      <Search size={18} color={colors.textMuted} strokeWidth={1.8} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={t('patients.search')}
        placeholderTextColor={colors.textMuted}
        onFocus={() => {
          setFocused(true);
          focusAnim.value = withTiming(1, { duration: 180 });
        }}
        onBlur={() => {
          setFocused(false);
          focusAnim.value = withTiming(0, { duration: 180 });
        }}
        style={[
          styles.input,
          {
            color: colors.text,
            marginLeft: 10,
            fontSize: 15,
            fontFamily: 'GolosText_400Regular',
            height: '100%',
            includeFontPadding: false,
          },
          Platform.OS === 'web'
            ? ({ outlineStyle: 'none', outlineWidth: 0 } as object)
            : null,
        ]}
        returnKeyType="search"
        accessibilityLabel={t('patients.search')}
        underlineColorAndroid="transparent"
        autoCorrect={false}
        autoCapitalize="none"
      />
      {value.length > 0 ? (
        <Pressable
          onPress={onClear}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t('patients.clear_search')}
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDark ? 'rgba(148,163,184,0.16)' : 'rgba(15,23,42,0.06)',
          }}
        >
          <X size={14} color={colors.textMuted} strokeWidth={2} />
        </Pressable>
      ) : null}
    </Animated.View>
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
    margin: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
});
