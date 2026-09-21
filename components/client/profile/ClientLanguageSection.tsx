import { Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { Check, Globe } from '@/components/icons';
import { LOCALE_OPTIONS } from '@/components/ui/LanguageMenu';
import { Text } from '@/components/ui/Text';
import type { LocaleCode } from '@/types';

export function ClientLanguageSection({
  locale,
  onSelect,
}: {
  locale: LocaleCode;
  onSelect: (code: LocaleCode) => void;
}) {
  const { t } = useTranslation();
  const { colors, hairline, isDark } = useLoginTheme();

  return (
    <Animated.View entering={FadeInDown.delay(80).duration(320)}>
      <View
        style={{
          backgroundColor: isDark ? '#151D2E' : '#F4F6FB',
          borderRadius: 20,
          borderWidth: 1,
          borderColor: hairline,
          padding: 14,
          gap: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: isDark ? 'rgba(129,140,248,0.14)' : 'rgba(67,56,202,0.08)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Globe size={16} color={colors.primary} strokeWidth={1.9} />
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
            <Text
              style={{
                fontFamily: 'GolosText_600SemiBold',
                fontSize: 14,
                lineHeight: 20,
                color: colors.text,
              }}
            >
              {t('profile.language')}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: 'GolosText_400Regular',
                fontSize: 12,
                lineHeight: 16,
                color: colors.textMuted,
              }}
            >
              {t('profile.language_hint')}
            </Text>
          </View>
        </View>

        <View style={{ gap: 8 }}>
          {[0, 1].map((row) => (
            <View key={row} style={{ flexDirection: 'row', gap: 8 }}>
              {LOCALE_OPTIONS.slice(row * 2, row * 2 + 2).map((item) => {
                const active = locale === item.code;
                return (
                  <View
                    key={item.code}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      borderRadius: 14,
                      overflow: 'hidden',
                      backgroundColor: active
                        ? isDark
                          ? '#6366F1'
                          : '#4338CA'
                        : isDark
                          ? 'rgba(255,255,255,0.06)'
                          : '#FFFFFF',
                      borderWidth: active ? 0 : 1,
                      borderColor: hairline,
                    }}
                  >
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={item.label}
                      onPress={() => {
                        void Haptics.selectionAsync();
                        onSelect(item.code);
                      }}
                      style={({ pressed }) => ({
                        paddingVertical: 12,
                        paddingHorizontal: 10,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        opacity: pressed ? 0.88 : 1,
                      })}
                    >
                      <Text style={{ fontSize: 16, lineHeight: 20 }}>{item.flag}</Text>
                      <Text
                        numberOfLines={1}
                        maxFontSizeMultiplier={1.05}
                        style={{
                          flex: 1,
                          fontFamily: active ? 'GolosText_600SemiBold' : 'GolosText_500Medium',
                          fontSize: 13,
                          lineHeight: 17,
                          color: active ? '#FFFFFF' : colors.text,
                        }}
                      >
                        {item.label}
                      </Text>
                      {active ? (
                        <Check size={14} color="#FFFFFF" strokeWidth={2.4} />
                      ) : null}
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}
