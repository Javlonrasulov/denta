import { Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { Text } from '@/components/ui/Text';
import type { DoctorProfile } from '@/types';

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  const { colors, hairline } = useLoginTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        minHeight: 46,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: hairline,
      }}
    >
      <Text
        numberOfLines={1}
        maxFontSizeMultiplier={1.1}
        style={{
          flexShrink: 0,
          fontFamily: 'GolosText_400Regular',
          fontSize: 13,
          lineHeight: 18,
          color: colors.textMuted,
        }}
      >
        {label}
      </Text>
      <Text
        numberOfLines={1}
        maxFontSizeMultiplier={1.05}
        style={{
          flex: 1,
          textAlign: 'right',
          fontFamily: 'GolosText_600SemiBold',
          fontSize: 13,
          lineHeight: 18,
          color: colors.text,
          ...(Platform.OS === 'android' ? { paddingRight: 2 } : null),
        }}
      >
        {value}
      </Text>
    </View>
  );
}

export function ProfessionalInfo({ profile }: { profile: DoctorProfile }) {
  const { t } = useTranslation();
  const { colors, hairline, isDark } = useLoginTheme();

  return (
    <Animated.View entering={FadeInDown.duration(280).delay(70)} style={{ gap: 8 }}>
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
        {t('doctor_profile.professional')}
      </Text>
      <View
        style={{
          backgroundColor: isDark ? '#151D2E' : '#F4F6FB',
          borderRadius: 20,
          borderWidth: 1,
          borderColor: hairline,
          paddingHorizontal: 16,
        }}
      >
        <Row label={t('doctor_profile.specialty')} value={profile.specialty} />
        <Row
          label={t('doctor_profile.experience')}
          value={t('doctor_profile.years_exp', { count: profile.experienceYears })}
        />
        <Row label={t('doctor_profile.clinic')} value={profile.clinicName} />
        <Row
          label={t('doctor_profile.working_hours')}
          value={`${profile.workingHours.start}–${profile.workingHours.end}`}
        />
        <Row
          label={t('doctor_profile.duration')}
          value={t('doctor_profile.duration_value', { count: profile.appointmentDuration })}
          last
        />
      </View>
    </Animated.View>
  );
}
