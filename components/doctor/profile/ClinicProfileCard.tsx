import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { Building2, ChevronRight, MapPin } from '@/components/icons';
import { Text } from '@/components/ui/Text';
import type { DoctorProfile } from '@/types';

export function ClinicProfileCard({
  profile,
  onOpen,
}: {
  profile: DoctorProfile;
  onOpen: () => void;
}) {
  const { t } = useTranslation();
  const { colors, hairline, isDark, field } = useLoginTheme();

  return (
    <Animated.View entering={FadeInDown.duration(280).delay(80)}>
      <ScalePressable
        accessibilityLabel={t('doctor_profile.clinic_profile')}
        onPress={onOpen}
        style={{
          backgroundColor: isDark ? '#151D2E' : '#F4F6FB',
          borderRadius: 20,
          borderWidth: 1,
          borderColor: hairline,
          padding: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 15,
            backgroundColor: isDark ? 'rgba(129,140,248,0.16)' : 'rgba(67,56,202,0.1)',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: isDark ? 'rgba(165,180,252,0.18)' : 'rgba(67,56,202,0.12)',
          }}
        >
          <Building2 size={20} color={colors.primary} strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: 'Geologica_600SemiBold',
              fontSize: 16,
              lineHeight: 22,
              letterSpacing: -0.2,
              color: colors.text,
            }}
          >
            {profile.clinicName}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <MapPin size={13} color={colors.textMuted} strokeWidth={1.8} />
            <Text
              numberOfLines={1}
              style={{
                flex: 1,
                fontFamily: 'GolosText_400Regular',
                fontSize: 12,
                lineHeight: 16,
                color: colors.textMuted,
              }}
            >
              {profile.clinicAddress || profile.clinicCity}
            </Text>
          </View>
          <Text
            style={{
              fontFamily: 'GolosText_600SemiBold',
              fontSize: 12,
              lineHeight: 16,
              color: colors.primary,
              marginTop: 2,
            }}
          >
            {t('doctor_profile.clinic_profile')}
          </Text>
        </View>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 10,
            backgroundColor: field,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronRight size={15} color={colors.textMuted} strokeWidth={1.9} />
        </View>
      </ScalePressable>
    </Animated.View>
  );
}
