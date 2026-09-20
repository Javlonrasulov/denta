import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { Text } from '@/components/ui/Text';
import type { CalendarView } from '@/utils/doctorCalendar';

export function CalendarViewSwitcher({
  value,
  onChange,
}: {
  value: CalendarView;
  onChange: (value: CalendarView) => void;
}) {
  const { t } = useTranslation();
  const { colors, field, hairline, isDark } = useLoginTheme();
  const options: CalendarView[] = ['day', 'week', 'month'];

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      style={{
        flexDirection: 'row',
        padding: 4,
        borderRadius: 16,
        backgroundColor: field,
        borderWidth: 1,
        borderColor: hairline,
      }}
    >
      {options.map((key) => {
        const selected = value === key;
        return (
          <ScalePressable
            key={key}
            accessibilityLabel={t(`doctor_app.${key}`)}
            onPress={() => {
              if (key === value) return;
              void Haptics.selectionAsync();
              onChange(key);
            }}
            style={{
              flex: 1,
              minWidth: 0,
              height: 36,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: selected
                ? isDark
                  ? '#222C42'
                  : '#FFFFFF'
                : 'transparent',
            }}
          >
            <Text
              maxFontSizeMultiplier={1}
              style={{
                fontFamily: selected ? 'GolosText_600SemiBold' : 'GolosText_500Medium',
                fontSize: 13,
                lineHeight: 18,
                color: selected ? colors.text : colors.textMuted,
              }}
            >
              {t(`doctor_app.${key}`)}
            </Text>
          </ScalePressable>
        );
      })}
    </Animated.View>
  );
}
