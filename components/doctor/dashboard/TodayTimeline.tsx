import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { TimelineAppointment } from '@/components/doctor/dashboard/TimelineAppointment';
import { Text } from '@/components/ui/Text';
import type { TimelineItem } from '@/utils/doctorDashboard';

export function TodayTimeline({
  items,
  empty,
  onItemPress,
  onCreate,
}: {
  items: TimelineItem[];
  empty?: boolean;
  onItemPress?: (item: TimelineItem) => void;
  onCreate?: () => void;
}) {
  const { t } = useTranslation();
  const { colors, hairline, isDark } = useLoginTheme();

  return (
    <Animated.View entering={FadeInDown.duration(300).delay(190)} style={{ gap: 14 }}>
      <Text
        style={{
          fontFamily: 'Geologica_700Bold',
          fontSize: 18,
          lineHeight: 24,
          letterSpacing: -0.2,
          color: colors.text,
        }}
      >
        {t('doctor_app.today_schedule')}
      </Text>

      {empty ? (
        <View
          style={{
            borderRadius: 20,
            borderWidth: 1,
            borderColor: hairline,
            padding: 20,
            gap: 10,
            backgroundColor: isDark ? '#151D2E' : '#F4F6FB',
          }}
        >
          <Text
            style={{
              fontFamily: 'GolosText_600SemiBold',
              fontSize: 16,
              lineHeight: 22,
              color: colors.text,
            }}
          >
            {t('doctor_app.empty_schedule')}
          </Text>
          <Text
            onPress={onCreate}
            style={{
              fontFamily: 'GolosText_600SemiBold',
              fontSize: 14,
              lineHeight: 20,
              color: colors.primary,
            }}
          >
            {t('doctor_app.add_appointment_cta')}
          </Text>
        </View>
      ) : (
        <View>
          {items.map((item, index) => (
            <TimelineAppointment
              key={item.id}
              item={item}
              isLast={index === items.length - 1}
              onPress={item.appointment ? () => onItemPress?.(item) : undefined}
            />
          ))}
        </View>
      )}
    </Animated.View>
  );
}
