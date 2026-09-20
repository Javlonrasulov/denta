import { useEffect, useRef } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { Text } from '@/components/ui/Text';
import type { DateStripItem } from '@/utils/doctorCalendar';

const ITEM_WIDTH = 58;
const ITEM_GAP = 8;

export function DateStrip({
  items,
  onSelect,
}: {
  items: DateStripItem[];
  onSelect: (key: string) => void;
}) {
  const { t } = useTranslation();
  const { colors, hairline, isDark } = useLoginTheme();
  const scrollRef = useRef<ScrollView>(null);
  const selectedIndex = items.findIndex((item) => item.isSelected);

  useEffect(() => {
    if (selectedIndex < 0) return;
    const x = Math.max(0, selectedIndex * (ITEM_WIDTH + ITEM_GAP) - ITEM_WIDTH * 2);
    scrollRef.current?.scrollTo({ x, animated: true });
  }, [selectedIndex]);

  return (
    <Animated.View entering={FadeInDown.duration(260).delay(40)}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: ITEM_GAP, paddingRight: 8 }}
      >
        {items.map((item) => {
          const selected = item.isSelected;
          return (
            <ScalePressable
              key={item.key}
              accessibilityLabel={`${t(`doctor_app.wd_${item.weekdayIndex}`)} ${item.day}`}
              onPress={() => onSelect(item.key)}
              style={{
                width: ITEM_WIDTH,
                height: 72,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                backgroundColor: selected
                  ? colors.primary
                  : isDark
                    ? '#151D2E'
                    : '#F4F6FB',
                borderWidth: selected ? 0 : 1,
                borderColor: item.isToday ? colors.primary : hairline,
              }}
            >
              <Text
                maxFontSizeMultiplier={1}
                numberOfLines={1}
                style={{
                  fontFamily: 'GolosText_600SemiBold',
                  fontSize: 11,
                  lineHeight: 14,
                  color: selected ? 'rgba(255,255,255,0.78)' : colors.textMuted,
                }}
              >
                {t(`doctor_app.wd_${item.weekdayIndex}`)}
              </Text>
              <Text
                maxFontSizeMultiplier={1}
                style={{
                  fontFamily: 'Geologica_700Bold',
                  fontSize: 18,
                  lineHeight: 22,
                  color: selected ? '#FFFFFF' : colors.text,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {item.day}
              </Text>
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: item.appointmentCount
                    ? selected
                      ? '#FFFFFF'
                      : colors.primary
                    : 'transparent',
                  opacity: item.appointmentCount ? 1 : 0,
                }}
              />
            </ScalePressable>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}
