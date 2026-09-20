import { Pressable, Text as RNText, View } from 'react-native';

import { Check } from '@/components/icons';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';
import type { LocaleCode } from '@/types';

export const LANGUAGE_MENU_WIDTH = 164;

export const LOCALE_OPTIONS: { code: LocaleCode; label: string; short: string; flag: string }[] = [
  { code: 'uz', label: 'O‘zbekcha', short: 'UZ', flag: '🇺🇿' },
  { code: 'uz-Cyrl', label: 'Ўзбекча', short: 'ЎЗ', flag: '🇺🇿' },
  { code: 'ru', label: 'Русский', short: 'RU', flag: '🇷🇺' },
  { code: 'en', label: 'English', short: 'EN', flag: '🇬🇧' },
];

export function languageMenuCardStyle(
  colors: { surfaceElevated: string; border: string },
  shadows: Record<string, object>,
) {
  return {
    width: LANGUAGE_MENU_WIDTH,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 6,
    ...shadows.lg,
  };
}

export function LanguageMenuItems({
  locale,
  onSelect,
}: {
  locale: LocaleCode;
  onSelect: (code: LocaleCode) => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={{ gap: 2 }}>
      {LOCALE_OPTIONS.map((item) => {
        const active = item.code === locale;
        return (
          <Pressable
            key={item.code}
            onPress={() => onSelect(item.code)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              height: 38,
              paddingLeft: 8,
              paddingRight: 6,
              borderRadius: 11,
              backgroundColor: active
                ? colors.primaryMuted
                : pressed
                  ? colors.surfaceSoft
                  : 'transparent',
            })}
          >
            <RNText style={{ fontSize: 15, width: 22, textAlign: 'center' }}>{item.flag}</RNText>
            <Text
              variant="caption"
              weight={active ? 'semibold' : 'medium'}
              color={active ? colors.primary : colors.textSecondary}
              numberOfLines={1}
              style={{ flex: 1, marginLeft: 8 }}
            >
              {item.label}
            </Text>
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: active ? colors.primary : 'transparent',
              }}
            >
              {active ? <Check size={12} color={colors.textInverse} strokeWidth={2.8} /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
