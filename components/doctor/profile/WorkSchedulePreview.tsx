import { Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { Text } from '@/components/ui/Text';
import type { DoctorWeekDaySchedule } from '@/types';
import { orderedSchedule } from '@/utils/doctorProfile';

export function WorkSchedulePreview({
  schedule,
  onManage,
}: {
  schedule: DoctorWeekDaySchedule[];
  onManage: () => void;
}) {
  const { t } = useTranslation();
  const { colors, hairline, isDark } = useLoginTheme();
  const days = orderedSchedule(schedule);
  const androidPad = Platform.OS === 'android' ? { paddingRight: 2 } : null;

  return (
    <Animated.View entering={FadeInDown.duration(280).delay(90)} style={{ gap: 8 }}>
      <Text
        maxFontSizeMultiplier={1}
        style={{
          fontFamily: 'Geologica_600SemiBold',
          fontSize: 11,
          lineHeight: 14,
          letterSpacing: 1.1,
          color: colors.textMuted,
          paddingHorizontal: 4,
        }}
      >
        {t('doctor_profile.schedule')}
      </Text>
      <View
        style={{
          backgroundColor: isDark ? '#151D2E' : '#F4F6FB',
          borderRadius: 20,
          borderWidth: 1,
          borderColor: hairline,
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 12,
        }}
      >
        {days.map((day, index) => (
          <View
            key={day.day}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              minHeight: 36,
              borderBottomWidth: index === days.length - 1 ? 0 : 1,
              borderBottomColor: hairline,
              gap: 12,
            }}
          >
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={1.05}
              style={{
                flex: 1,
                fontFamily: 'GolosText_500Medium',
                fontSize: 13,
                lineHeight: 18,
                color: colors.text,
              }}
            >
              {t(`doctor_profile.day_${day.day}`)}
            </Text>
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={1}
              style={{
                fontFamily: day.closed ? 'GolosText_400Regular' : 'GolosText_600SemiBold',
                fontSize: 13,
                lineHeight: 18,
                color: day.closed ? colors.textMuted : colors.text,
                fontVariant: ['tabular-nums'],
                ...androidPad,
              }}
            >
              {day.closed ? t('doctor_profile.day_off') : `${day.start}–${day.end}`}
            </Text>
          </View>
        ))}
        <ScalePressable
          accessibilityLabel={t('doctor_profile.manage_schedule')}
          onPress={onManage}
          style={{
            marginTop: 10,
            height: 40,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDark ? 'rgba(129,140,248,0.14)' : 'rgba(67,56,202,0.08)',
          }}
        >
          <Text
            style={{
              fontFamily: 'GolosText_600SemiBold',
              fontSize: 13,
              color: colors.primary,
            }}
          >
            {t('doctor_profile.manage_schedule')}
          </Text>
        </ScalePressable>
      </View>
    </Animated.View>
  );
}
