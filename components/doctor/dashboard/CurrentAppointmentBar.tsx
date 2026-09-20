import { Platform, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { Text } from '@/components/ui/Text';
import type { Appointment, Doctor } from '@/types';
import { appointmentDuration, endTimeFor } from '@/utils/doctorDashboard';

export function CurrentAppointmentBar({
  appointment,
  doctor,
  elapsedMinutes,
  onPatient,
  onOpen,
}: {
  appointment: Appointment;
  doctor?: Doctor | null;
  elapsedMinutes: number;
  onPatient?: () => void;
  onOpen?: () => void;
}) {
  const { t } = useTranslation();
  const { colors, hairline, cta, ctaText, isDark } = useLoginTheme();
  const androidPad = Platform.OS === 'android' ? { paddingRight: 6 } : null;
  const duration = appointmentDuration(appointment, doctor);

  return (
    <Animated.View
      entering={FadeInDown.duration(280).delay(20)}
      style={{
        borderRadius: 18,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(34,211,238,0.22)' : 'rgba(8,145,178,0.18)',
        backgroundColor: isDark ? 'rgba(8,145,178,0.1)' : 'rgba(8,145,178,0.06)',
        padding: 14,
        gap: 10,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.secondary,
          }}
        />
        <Text
          style={{
            fontFamily: 'Geologica_600SemiBold',
            fontSize: 11,
            lineHeight: 14,
            letterSpacing: 1.2,
            color: colors.secondary,
          }}
        >
          {t('doctor_app.current_appointment')}
        </Text>
      </View>
      <Text
        style={{
          fontFamily: 'GolosText_600SemiBold',
          fontSize: 16,
          lineHeight: 22,
          color: colors.text,
          ...androidPad,
        }}
      >
        {appointment.patientName}
      </Text>
      <Text
        style={{
          fontFamily: 'GolosText_400Regular',
          fontSize: 13,
          lineHeight: 18,
          color: colors.textSecondary,
        }}
      >
        {`${appointment.time} – ${endTimeFor(appointment.time, duration)} · ${t(
          'doctor_app.elapsed_minutes',
          { count: Math.max(1, elapsedMinutes) },
        )}`}
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <ScalePressable
          onPress={onPatient}
          accessibilityLabel={t('doctor_app.patient_card')}
          style={{
            flex: 1,
            height: 40,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: hairline,
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              fontFamily: 'GolosText_600SemiBold',
              fontSize: 13,
              color: colors.text,
            }}
          >
            {t('doctor_app.patient_card')}
          </Text>
        </ScalePressable>
        <ScalePressable
          onPress={onOpen}
          accessibilityLabel={t('doctor_app.open_treatment')}
          style={{
            flex: 1,
            height: 40,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <LinearGradient
            colors={cta}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          />
          <Text
            numberOfLines={1}
            style={{
              fontFamily: 'Geologica_600SemiBold',
              fontSize: 13,
              color: ctaText,
            }}
          >
            {t('doctor_app.open_treatment')}
          </Text>
        </ScalePressable>
      </View>
    </Animated.View>
  );
}
