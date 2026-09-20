import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { SLOT_TONE } from '@/components/doctor/calendar/calendarTokens';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { Text } from '@/components/ui/Text';
import type { WeekDayAgenda } from '@/utils/doctorCalendar';
import { slotKindFor } from '@/utils/doctorCalendar';

export function WeekAgenda({
  days,
  nowMinutes,
  todayKey,
  onSelectDay,
  onOpenAppointment,
}: {
  days: WeekDayAgenda[];
  nowMinutes: number;
  todayKey: string;
  onSelectDay: (key: string) => void;
  onOpenAppointment?: (id: string) => void;
}) {
  const { t } = useTranslation();
  const { colors, hairline, isDark } = useLoginTheme();

  return (
    <Animated.View entering={FadeInDown.duration(260)} style={{ gap: 10 }}>
      {days.map((day) => {
        const selected = day.isSelected;
        return (
          <View
            key={day.key}
            style={{
              borderRadius: 20,
              borderWidth: 1,
              borderColor: selected ? colors.primary : hairline,
              backgroundColor: selected
                ? isDark
                  ? 'rgba(129,140,248,0.1)'
                  : 'rgba(67,56,202,0.06)'
                : isDark
                  ? '#151D2E'
                  : '#F4F6FB',
              padding: 14,
              gap: 10,
            }}
          >
            <ScalePressable
              accessibilityLabel={`${t(`doctor_app.wd_${day.weekdayIndex}`)} ${day.day}`}
              onPress={() => onSelectDay(day.key)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
            >
              <View style={{ width: 44, alignItems: 'flex-start' }}>
                <Text
                  maxFontSizeMultiplier={1}
                  style={{
                    fontFamily: 'Geologica_600SemiBold',
                    fontSize: 11,
                    lineHeight: 14,
                    color: day.isToday ? colors.primary : colors.textMuted,
                  }}
                >
                  {t(`doctor_app.wd_${day.weekdayIndex}`)}
                </Text>
                <Text
                  maxFontSizeMultiplier={1}
                  style={{
                    fontFamily: 'Geologica_700Bold',
                    fontSize: 22,
                    lineHeight: 28,
                    color: colors.text,
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {day.day}
                </Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={{
                    fontFamily: 'GolosText_400Regular',
                    fontSize: 12,
                    lineHeight: 16,
                    color: colors.textMuted,
                  }}
                >
                  {t('doctor_app.week_booked_free', { booked: day.booked, free: day.free })}
                </Text>
              </View>
            </ScalePressable>

            {day.appointments.length === 0 ? (
              <Text
                style={{
                  fontFamily: 'GolosText_400Regular',
                  fontSize: 13,
                  lineHeight: 18,
                  color: colors.textMuted,
                }}
              >
                {t('doctor_app.empty_day_short')}
              </Text>
            ) : (
              <View style={{ gap: 2 }}>
                {day.appointments.slice(0, 4).map((apt) => {
                  const kind = slotKindFor(apt, nowMinutes, 30, apt.date === todayKey);
                  const tone = SLOT_TONE[kind];
                  return (
                    <ScalePressable
                      key={apt.id}
                      onPress={() => onOpenAppointment?.(apt.id)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        paddingVertical: 6,
                      }}
                    >
                      <View
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: tone.accent,
                        }}
                      />
                      <Text
                        maxFontSizeMultiplier={1}
                        style={{
                          width: 42,
                          fontFamily: 'GolosText_600SemiBold',
                          fontSize: 12,
                          lineHeight: 16,
                          color: colors.textMuted,
                          fontVariant: ['tabular-nums'],
                        }}
                      >
                        {apt.time}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={{
                          flex: 1,
                          fontFamily: 'GolosText_600SemiBold',
                          fontSize: 13,
                          lineHeight: 18,
                          color: colors.text,
                        }}
                      >
                        {apt.patientName}
                      </Text>
                    </ScalePressable>
                  );
                })}
                {day.appointments.length > 4 ? (
                  <Text
                    style={{
                      fontFamily: 'GolosText_500Medium',
                      fontSize: 12,
                      lineHeight: 16,
                      color: colors.primary,
                    }}
                  >
                    +{day.appointments.length - 4}
                  </Text>
                ) : null}
              </View>
            )}
          </View>
        );
      })}
    </Animated.View>
  );
}
