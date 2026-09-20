import { Platform, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { Text } from '@/components/ui/Text';
import type { CalendarFilter } from '@/utils/doctorCalendar';

const FILTERS: CalendarFilter[] = ['all', 'today', 'confirmed', 'free', 'cancelled'];

export function CalendarFilters({
  value,
  onChange,
}: {
  value: CalendarFilter;
  onChange: (value: CalendarFilter) => void;
}) {
  const { t } = useTranslation();
  const { colors, hairline, isDark } = useLoginTheme();

  return (
    <Animated.View entering={FadeInDown.duration(240).delay(70)}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingRight: 8 }}
      >
        {FILTERS.map((key) => {
          const selected = value === key;
          return (
            <ScalePressable
              key={key}
              accessibilityLabel={t(`doctor_app.filter_${key}`)}
              onPress={() => {
                void Haptics.selectionAsync();
                onChange(key);
              }}
              style={{
                height: 34,
                paddingHorizontal: 14,
                borderRadius: 17,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: selected
                  ? isDark
                    ? 'rgba(129,140,248,0.18)'
                    : 'rgba(67,56,202,0.1)'
                  : isDark
                    ? '#151D2E'
                    : '#F4F6FB',
                borderWidth: 1,
                borderColor: selected ? colors.primary : hairline,
              }}
            >
              <Text
                maxFontSizeMultiplier={1}
                style={{
                  fontFamily: selected ? 'GolosText_600SemiBold' : 'GolosText_500Medium',
                  fontSize: 12,
                  lineHeight: 16,
                  color: selected ? colors.primary : colors.textSecondary,
                  ...(Platform.OS === 'android' ? { paddingRight: 2 } : null),
                }}
              >
                {t(`doctor_app.filter_${key}`)}
              </Text>
            </ScalePressable>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}
