import { Pressable, Text as RNText, StyleSheet, View } from 'react-native';

import { Check } from '@/components/icons';
import { useTheme } from '@/theme';
import type { LocaleCode } from '@/types';

export const LANGUAGE_MENU_WIDTH = 236;

export const LOCALE_OPTIONS: { code: LocaleCode; label: string; short: string; flag: string }[] = [
  { code: 'uz', label: 'O‘zbekcha', short: 'Uz', flag: '🇺🇿' },
  { code: 'uz-Cyrl', label: 'Ўзбекча', short: 'Ўз', flag: '🇺🇿' },
  { code: 'ru', label: 'Русский', short: 'Ru', flag: '🇷🇺' },
  { code: 'en', label: 'English', short: 'En', flag: '🇬🇧' },
];

export function languageMenuCardStyle(
  colors: { surfaceElevated: string; border: string; borderSubtle?: string },
  shadows: Record<string, object>,
) {
  return {
    width: 236,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSubtle ?? colors.border,
    paddingVertical: 8,
    paddingHorizontal: 8,
    ...shadows.lg,
  };
}

/**
 * Premium language popover.
 * Single child View inside Pressable — Android can stack Pressable children
 * when the native view hierarchy treats it like a Button.
 */
export function LanguageMenuItems({
  locale,
  onSelect,
}: {
  locale: LocaleCode;
  onSelect: (code: LocaleCode) => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.list}>
      {LOCALE_OPTIONS.map((item, index) => {
        const active = item.code === locale;
        return (
          <Pressable
            key={item.code}
            onPress={() => onSelect(item.code)}
            accessibilityLabel={item.label}
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [
              styles.hit,
              index < LOCALE_OPTIONS.length - 1 ? styles.hitGap : null,
              {
                backgroundColor: active
                  ? colors.primaryMuted
                  : pressed
                    ? colors.surfaceSoft
                    : 'transparent',
              },
            ]}
          >
            <View style={styles.row} pointerEvents="none">
              <View
                style={[
                  styles.flagSlot,
                  { backgroundColor: active ? colors.surface : colors.surfaceSoft },
                ]}
              >
                <RNText style={styles.flag}>{item.flag}</RNText>
              </View>

              <RNText
                style={[
                  styles.label,
                  {
                    color: active ? colors.primary : colors.text,
                    fontWeight: active ? '600' : '500',
                  },
                ]}
              >
                {item.label}
              </RNText>

              <View
                style={[
                  styles.checkSlot,
                  active
                    ? { backgroundColor: colors.primary, borderWidth: 0 }
                    : {
                        backgroundColor: 'transparent',
                        borderColor: colors.border,
                        borderWidth: 1.5,
                      },
                ]}
              >
                {active ? <Check size={12} color={colors.textInverse} strokeWidth={2.8} /> : null}
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    width: '100%',
  },
  hit: {
    borderRadius: 14,
  },
  hitGap: {
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    paddingHorizontal: 10,
    width: '100%',
  },
  flagSlot: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  flag: {
    fontSize: 16,
    lineHeight: 20,
    textAlign: 'center',
  },
  label: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
    paddingRight: 8,
    includeFontPadding: false,
  },
  checkSlot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
