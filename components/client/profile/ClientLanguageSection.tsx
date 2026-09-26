import { Pressable, Text as RNText, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { Check, Globe } from '@/components/icons';
import { LOCALE_OPTIONS } from '@/components/ui/LanguageMenu';
import { Text } from '@/components/ui/Text';
import type { LocaleCode } from '@/types';

const CHIP_H = 72;
const GRID_GAP = 10;

function LanguageChip({
  flag,
  label,
  active,
  onPress,
  isDark,
  hairline,
  textColor,
}: {
  flag: string;
  label: string;
  active: boolean;
  onPress: () => void;
  isDark: boolean;
  hairline: string;
  textColor: string;
}) {
  const bg = active
    ? isDark
      ? '#6366F1'
      : '#4338CA'
    : isDark
      ? 'rgba(255,255,255,0.06)'
      : '#FFFFFF';

  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        height: CHIP_H,
        borderRadius: 14,
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: active ? bg : hairline,
        overflow: 'hidden',
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        accessibilityLabel={label}
        onPress={() => {
          void Haptics.selectionAsync();
          onPress();
        }}
        style={({ pressed }) => ({
          width: '100%',
          height: '100%',
          opacity: pressed ? 0.88 : 1,
        })}
      >
        <View
          style={{
            width: '100%',
            height: '100%',
            paddingLeft: 12,
            paddingRight: 10,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 28,
              height: 28,
              marginRight: 10,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RNText
              allowFontScaling={false}
              style={{
                fontSize: 16,
                lineHeight: 20,
                height: 20,
                includeFontPadding: false,
                textAlign: 'center',
                textAlignVertical: 'center',
                // Android emoji glyphs sit high — nudge for optical center with label
                transform: [{ translateY: 1 }],
              }}
            >
              {flag}
            </RNText>
          </View>

          <View
            style={{
              flex: 1,
              minWidth: 0,
              height: 28,
              justifyContent: 'center',
              marginRight: 8,
            }}
          >
            <RNText
              numberOfLines={1}
              allowFontScaling={false}
              style={{
                fontFamily: 'GolosText_600SemiBold',
                fontSize: 13,
                lineHeight: 18,
                color: active ? '#FFFFFF' : textColor,
                includeFontPadding: false,
              }}
            >
              {label}
            </RNText>
          </View>

          <View
            style={{
              width: 22,
              height: 22,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {active ? <Check size={16} color="#FFFFFF" strokeWidth={2.4} /> : null}
          </View>
        </View>
      </Pressable>
    </View>
  );
}

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

        <View style={{ gap: GRID_GAP }}>
          {[0, 1].map((row) => (
            <View key={row} style={{ flexDirection: 'row', gap: GRID_GAP }}>
              {LOCALE_OPTIONS.slice(row * 2, row * 2 + 2).map((item) => (
                <LanguageChip
                  key={item.code}
                  flag={item.flag}
                  label={item.label}
                  active={locale === item.code}
                  isDark={isDark}
                  hairline={hairline}
                  textColor={colors.text}
                  onPress={() => onSelect(item.code)}
                />
              ))}
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}
