import React from 'react';
import { Pressable, Text as RNText, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useSettingsStore, type UiFontSize } from '@/store/settingsStore';
import { useTheme } from '@/theme';

const SIZES: UiFontSize[] = ['sm', 'md', 'lg', 'xl'];
const DOT = [5, 7, 9, 11];

export function FontSizeControl() {
  const { t } = useTranslation();
  const { colors, radius, fontWeight } = useTheme();
  const fontSize = useSettingsStore((s) => s.fontSize);
  const setFontSize = useSettingsStore((s) => s.setFontSize);
  const currentIdx = Math.max(0, SIZES.indexOf(fontSize));

  return (
    <View
      style={{
        height: 40,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderRadius: radius.md,
        backgroundColor: colors.surfaceSoft,
      }}
      accessibilityRole="adjustable"
      accessibilityLabel={t('profile.font_size')}
    >
      <Pressable
        onPress={() => currentIdx > 0 && setFontSize(SIZES[currentIdx - 1])}
        disabled={currentIdx === 0}
        accessibilityRole="button"
        accessibilityLabel={t('profile.font_size_decrease')}
        style={({ pressed }) => ({
          width: 32,
          height: 32,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radius.sm,
          backgroundColor: pressed && currentIdx > 0 ? colors.primaryMuted : 'transparent',
          opacity: currentIdx === 0 ? 0.35 : 1,
        })}
      >
        <RNText
          style={{
            fontFamily: fontWeight.bold,
            fontSize: 12,
            lineHeight: 14,
            color: colors.textSecondary,
            letterSpacing: -0.3,
          }}
        >
          A−
        </RNText>
      </Pressable>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
          paddingHorizontal: 6,
          minWidth: 56,
        }}
      >
        {SIZES.map((size, i) => {
          const active = fontSize === size;
          const d = DOT[i];
          return (
            <Pressable
              key={size}
              onPress={() => setFontSize(size)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              hitSlop={8}
              style={{
                width: 14,
                height: 14,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  width: d,
                  height: d,
                  borderRadius: d / 2,
                  backgroundColor: active ? colors.secondary : colors.chartMuted,
                  transform: active ? [{ scale: 1.15 }] : undefined,
                }}
              />
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => currentIdx < SIZES.length - 1 && setFontSize(SIZES[currentIdx + 1])}
        disabled={currentIdx === SIZES.length - 1}
        accessibilityRole="button"
        accessibilityLabel={t('profile.font_size_increase')}
        style={({ pressed }) => ({
          width: 32,
          height: 32,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radius.sm,
          backgroundColor:
            pressed && currentIdx < SIZES.length - 1 ? colors.primaryMuted : 'transparent',
          opacity: currentIdx === SIZES.length - 1 ? 0.35 : 1,
        })}
      >
        <RNText
          style={{
            fontFamily: fontWeight.bold,
            fontSize: 15,
            lineHeight: 17,
            color: colors.textSecondary,
            letterSpacing: -0.3,
          }}
        >
          A+
        </RNText>
      </Pressable>
    </View>
  );
}
