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
            width: 46,
            height: 46,
            borderRadius: 14,
            backgroundColor: field,
            alignItems: 'center',
            justifyContent: 'center',
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
              color: colors.text,
            }}
          >
            {profile.clinicName}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
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
              {profile.clinicAddress}
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
        <ChevronRight size={16} color={colors.textMuted} strokeWidth={1.8} />
      </ScalePressable>
    </Animated.View>
  );
}
