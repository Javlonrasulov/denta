import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { Building2, MapPin, Phone } from '@/components/icons';
import { Text } from '@/components/ui/Text';
import type { Clinic, DoctorProfile } from '@/types';
import { ProfileSheet } from './ProfileSheet';

export function ClinicProfileSheet({
  visible,
  profile,
  clinic,
  onClose,
}: {
  visible: boolean;
  profile: DoctorProfile | null;
  clinic?: Clinic | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { colors, field, hairline } = useLoginTheme();

  return (
    <ProfileSheet
      visible={visible}
      onClose={onClose}
      title={t('doctor_profile.clinic_open')}
      scroll={false}
    >
      <View
        style={{
          borderRadius: 18,
          borderWidth: 1,
          borderColor: hairline,
          backgroundColor: field,
          padding: 16,
          gap: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Building2 size={18} color={colors.primary} strokeWidth={1.8} />
          <Text
            style={{
              flex: 1,
              fontFamily: 'Geologica_600SemiBold',
              fontSize: 18,
              color: colors.text,
            }}
          >
            {profile?.clinicName}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          <MapPin size={16} color={colors.textMuted} strokeWidth={1.8} />
          <Text
            style={{
              flex: 1,
              fontFamily: 'GolosText_400Regular',
              fontSize: 14,
              lineHeight: 20,
              color: colors.textSecondary,
            }}
          >
            {profile?.clinicAddress}
          </Text>
        </View>
        {clinic?.phone ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Phone size={16} color={colors.textMuted} strokeWidth={1.8} />
            <Text
              style={{
                fontFamily: 'GolosText_500Medium',
                fontSize: 14,
                color: colors.textSecondary,
              }}
            >
              {clinic.phone}
            </Text>
          </View>
        ) : null}
        {clinic?.about ? (
          <Text
            style={{
              fontFamily: 'GolosText_400Regular',
              fontSize: 13,
              lineHeight: 20,
              color: colors.textMuted,
            }}
          >
            {clinic.about}
          </Text>
        ) : null}
      </View>
    </ProfileSheet>
  );
}
