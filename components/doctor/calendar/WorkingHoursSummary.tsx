import { Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { Text } from '@/components/ui/Text';
import type { WorkingHoursSummary } from '@/utils/doctorCalendar';

function Stat({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  const { colors, hairline } = useLoginTheme();
  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        paddingRight: last ? 0 : 10,
        borderRightWidth: last ? 0 : 1,
        borderRightColor: hairline,
        gap: 3,
      }}
    >
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
        {label}
      </Text>
      <Text
        maxFontSizeMultiplier={1}
        numberOfLines={1}
        style={{
          fontFamily: 'Geologica_700Bold',
          fontSize: 14,
          lineHeight: 18,
          color: colors.text,
          fontVariant: ['tabular-nums'],
          ...(Platform.OS === 'android' ? { paddingRight: 4 } : null),
        }}
      >
        {value}
      </Text>
    </View>
  );
}

export function WorkingHoursSummary({
  summary,
  isToday,
}: {
  summary: WorkingHoursSummary;
  isToday?: boolean;
}) {
  const { t } = useTranslation();
  const { colors, hairline, isDark } = useLoginTheme();

  return (
    <Animated.View
      entering={FadeInDown.duration(280).delay(90)}
      style={{
        borderRadius: 20,
        borderWidth: 1,
        borderColor: hairline,
        backgroundColor: isDark ? '#151D2E' : '#F4F6FB',
        padding: 16,
        gap: 14,
      }}
    >
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Stat
          label={t('doctor_app.working_time')}
          value={`${summary.start} – ${summary.end}`}
        />
        <Stat
          label={t('doctor_app.break_time')}
          value={`${summary.breakStart} – ${summary.breakEnd}`}
        />
        <Stat
          label={t('doctor_app.visit_length')}
          value={t('doctor_app.minutes_short', { count: summary.durationMinutes })}
          last
        />
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: hairline,
        }}
      >
        <Text
          maxFontSizeMultiplier={1.05}
          style={{
            flex: 1,
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
              {isToday ? t('doctor_app.next_label') : t('doctor_app.first_label')}{' '}
              {summary.nextAppointment.time}
            </Text>
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}
