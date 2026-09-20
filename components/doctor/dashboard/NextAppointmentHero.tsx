import { Platform, View } from 'react-native';
import * as Linking from 'expo-linking';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { Phone, UserRound } from '@/components/icons';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { Avatar } from '@/components/ui/Avatar';
import { Text } from '@/components/ui/Text';
import type { Appointment, Doctor, Room } from '@/types';
import { appointmentDuration, endTimeFor, parseMinutes } from '@/utils/doctorDashboard';

function formatUntilLabel(
  until: number,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  if (until <= 0) return t('doctor_app.status_current');
  if (until < 60) return t('doctor_app.in_minutes', { count: until });
  return t('doctor_app.in_hours', { count: Math.max(1, Math.round(until / 60)) });
}

export function NextAppointmentHero({
  appointment,
  doctor,
  room,
  nowMinutes,
  workingRange,
  onPatient,
  onCreate,
  phone,
}: {
  appointment: Appointment | null;
  doctor?: Doctor | null;
  room?: Room;
  nowMinutes: number;
  workingRange?: string;
  onPatient?: () => void;
  onCreate?: () => void;
  phone?: string;
}) {
  const { t } = useTranslation();
  const { colors, hairline, isDark, cta, ctaText, field } = useLoginTheme();
  const androidPad = Platform.OS === 'android' ? { paddingRight: 8 } : null;

  if (!appointment) {
    return (
      <Animated.View entering={FadeInDown.duration(300).delay(40)}>
        <View
          style={{
            borderRadius: 22,
            borderWidth: 1,
            borderColor: hairline,
            backgroundColor: isDark ? '#151D2E' : '#F4F6FB',
            padding: 20,
            gap: 14,
          }}
        >
          <Text
            style={{
              fontFamily: 'Geologica_600SemiBold',
              fontSize: 11,
              lineHeight: 14,
              letterSpacing: 1.4,
              color: colors.primary,
            }}
          >
            {t('doctor_app.next_appointment')}
          </Text>
          <Text
            style={{
              fontFamily: 'Geologica_700Bold',
              fontSize: 22,
              lineHeight: 28,
              color: colors.text,
              ...androidPad,
            }}
          >
            {t('doctor_app.no_appointments_today')}
          </Text>
          {workingRange ? (
            <Text
              style={{
                fontFamily: 'GolosText_400Regular',
                fontSize: 14,
                lineHeight: 20,
                color: colors.textSecondary,
                ...androidPad,
              }}
            >
              {t('doctor_app.no_appointments_hint', { range: workingRange })}
            </Text>
          ) : null}
          <ScalePressable
            accessibilityLabel={t('doctor_app.add_appointment_cta')}
            onPress={onCreate}
            style={{
              height: 44,
              borderRadius: 14,
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
              style={{
                fontFamily: 'Geologica_600SemiBold',
                fontSize: 14,
                lineHeight: 18,
                color: ctaText,
              }}
            >
              {t('doctor_app.add_appointment_cta')}
            </Text>
          </ScalePressable>
        </View>
      </Animated.View>
    );
  }

  const duration = appointmentDuration(appointment, doctor);
  const until = parseMinutes(appointment.time) - nowMinutes;
  const meta = formatUntilLabel(until, t);

  return (
    <Animated.View entering={FadeInDown.duration(320).delay(40)}>
      <LinearGradient
        colors={
          isDark
            ? (['#1B2150', '#151D2E'] as const)
            : (['#EEF2FF', '#E4E9FA'] as const)
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 22,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(165,180,252,0.18)' : 'rgba(67,56,202,0.12)',
          padding: 20,
          gap: 16,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text
            style={{
              fontFamily: 'Geologica_600SemiBold',
              fontSize: 11,
              lineHeight: 14,
              letterSpacing: 1.4,
              color: colors.primary,
            }}
          >
            {t('doctor_app.next_appointment')}
          </Text>
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
              backgroundColor: isDark ? 'rgba(129,140,248,0.18)' : 'rgba(67,56,202,0.1)',
            }}
          >
            <Text
              style={{
                fontFamily: 'GolosText_600SemiBold',
                fontSize: 11,
                lineHeight: 14,
                color: colors.primary,
              }}
            >
              {t('appointments.status_upcoming')}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
            <Text
              maxFontSizeMultiplier={1}
              style={{
                fontFamily: 'Geologica_700Bold',
                fontSize: 34,
                lineHeight: 40,
                letterSpacing: -0.6,
                color: colors.text,
                fontVariant: ['tabular-nums'],
              }}
            >
              {appointment.time}
            </Text>
            <Text
              style={{
                fontFamily: 'GolosText_400Regular',
                fontSize: 13,
                lineHeight: 18,
                color: colors.textMuted,
              }}
            >
              {appointment.time} – {endTimeFor(appointment.time, duration)}
              {room ? ` · ${t('doctor_app.room', { number: room.number })}` : ''}
            </Text>
          </View>
          {phone ? (
            <ScalePressable
              accessibilityLabel={t('doctor_app.call')}
              onPress={() => void Linking.openURL(`tel:${phone}`)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
                borderWidth: 1,
                borderColor: hairline,
              }}
            >
              <Phone size={18} color={colors.primary} strokeWidth={1.8} />
            </ScalePressable>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Avatar
            name={appointment.patientName}
            size={44}
            style={{
              backgroundColor: isDark ? field : '#FFFFFF',
              borderWidth: 1,
              borderColor: hairline,
            }}
          />
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text
              maxFontSizeMultiplier={1.1}
              style={{
                fontFamily: 'GolosText_600SemiBold',
                fontSize: 17,
                lineHeight: 22,
                color: colors.text,
                ...androidPad,
              }}
            >
              {appointment.patientName}
            </Text>
            <Text
              maxFontSizeMultiplier={1.1}
              style={{
                fontFamily: 'GolosText_400Regular',
                fontSize: 14,
                lineHeight: 20,
                color: colors.textSecondary,
                ...androidPad,
              }}
            >
              {appointment.serviceName}
            </Text>
          </View>
        </View>

        <Text
          style={{
            fontFamily: 'GolosText_500Medium',
            fontSize: 13,
            lineHeight: 18,
            color: colors.primary,
          }}
        >
          {meta}
        </Text>

        <ScalePressable
          accessibilityLabel={t('doctor_app.patient_card')}
          onPress={onPatient}
          style={{
            height: 44,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 6,
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
            borderWidth: 1,
            borderColor: hairline,
          }}
        >
          <UserRound size={16} color={colors.text} strokeWidth={1.8} />
          <Text
            numberOfLines={1}
            style={{
              fontFamily: 'GolosText_600SemiBold',
              fontSize: 13,
              lineHeight: 18,
              color: colors.text,
            }}
          >
            {t('doctor_app.patient_card')}
          </Text>
        </ScalePressable>
      </LinearGradient>
    </Animated.View>
  );
}
