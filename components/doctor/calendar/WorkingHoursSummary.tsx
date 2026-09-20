import { Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { Text } from '@/components/ui/Text';
import type { WorkingHoursSummary as Summary } from '@/utils/doctorCalendar';

export function WorkingHoursSummary({
  summary,
  isToday,
}: {
  summary: Summary;
  isToday?: boolean;
}) {
  const { t } = useTranslation();
  const { colors, hairline, isDark } = useLoginTheme();
  const androidPad = Platform.OS === 'android' ? { paddingRight: 4 } : null;

  return (
    <Animated.View
      entering={FadeInDown.duration(280).delay(90)}
      style={{
        borderRadius: 20,
        borderWidth: 1,
        borderColor: hairline,
        backgroundColor: isDark ? '#151D2E' : '#F4F6FB',
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 10,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ gap: 2, flexShrink: 0 }}>
          <Text
            maxFontSizeMultiplier={1}
            style={{
              fontFamily: 'Geologica_600SemiBold',
              fontSize: 10,
              lineHeight: 13,
              letterSpacing: 0.7,
              color: colors.textMuted,
            }}
          >
            {t('doctor_app.working_time')}
          </Text>
          <Text
            maxFontSizeMultiplier={1}
            style={{
              fontFamily: 'Geologica_700Bold',
              fontSize: 20,
              lineHeight: 24,
              color: colors.text,
              fontVariant: ['tabular-nums'],
              ...androidPad,
            }}
          >
            {summary.start}–{summary.end}
          </Text>
        </View>
        {summary.nextAppointment ? (
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 10,
              backgroundColor: isDark ? 'rgba(129,140,248,0.16)' : 'rgba(67,56,202,0.1)',
            }}
          >
            <Text
              maxFontSizeMultiplier={1}
              style={{
                fontFamily: 'GolosText_600SemiBold',
                fontSize: 11,
                lineHeight: 14,
                color: colors.primary,
              }}
            >
              {isToday ? t('doctor_app.next_label') : t('doctor_app.first_label')} {summary.nextAppointment.time}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 10,
            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)',
          }}
        >
          <Text
            maxFontSizeMultiplier={1}
            style={{
              fontFamily: 'GolosText_500Medium',
              fontSize: 12,
              lineHeight: 16,
              color: colors.textSecondary,
              fontVariant: ['tabular-nums'],
            }}
          >
            {t('doctor_app.break_time')} {summary.breakStart}–{summary.breakEnd}
          </Text>
        </View>
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 10,
            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)',
          }}
        >
          <Text
            maxFontSizeMultiplier={1}
            style={{
              fontFamily: 'GolosText_500Medium',
              fontSize: 12,
              lineHeight: 16,
              color: colors.textSecondary,
            }}
          >
            {t('doctor_app.minutes_short', { count: summary.durationMinutes })}
          </Text>
        </View>
      </View>

      <Text
        maxFontSizeMultiplier={1.05}
        style={{
          fontFamily: 'GolosText_500Medium',
          fontSize: 13,
          lineHeight: 18,
          color: colors.textSecondary,
        }}
      >
        {t('doctor_app.slots_busy_free', {
          booked: summary.bookedSlots,
          free: summary.freeSlots,
        })}
      </Text>
    </Animated.View>
  );
}
