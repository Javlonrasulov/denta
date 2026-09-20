import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { Text } from '@/components/ui/Text';
import { PremiumToggle } from './PremiumToggle';
import { ProfileSheet } from './ProfileSheet';

export function PrivacySheet({
  visible,
  clinicVisible,
  searchVisible,
  analytics,
  onClose,
  onChange,
}: {
  visible: boolean;
  clinicVisible: boolean;
  searchVisible: boolean;
  analytics: boolean;
  onClose: () => void;
  onChange: (patch: {
    privacyVisibleToClinic?: boolean;
    privacyVisibleInSearch?: boolean;
    privacyAnalytics?: boolean;
  }) => void;
}) {
  const { t } = useTranslation();
  const { colors, hairline } = useLoginTheme();

  const Row = ({
    label,
    value,
    onToggle,
  }: {
    label: string;
    value: boolean;
    onToggle: (next: boolean) => void;
  }) => (
    <View
      style={{
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: hairline,
      }}
    >
      <Text
        style={{
          flex: 1,
          fontFamily: 'GolosText_500Medium',
          fontSize: 15,
          color: colors.text,
        }}
      >
        {label}
      </Text>
      <PremiumToggle value={value} onChange={onToggle} />
    </View>
  );

  return (
    <ProfileSheet
      visible={visible}
      onClose={onClose}
      title={t('doctor_profile.privacy_title')}
      subtitle={t('doctor_profile.coming_soon')}
    >
      <Row
        label={t('doctor_profile.privacy_clinic')}
        value={clinicVisible}
        onToggle={(next) => onChange({ privacyVisibleToClinic: next })}
      />
      <Row
        label={t('doctor_profile.privacy_search')}
        value={searchVisible}
        onToggle={(next) => onChange({ privacyVisibleInSearch: next })}
      />
      <View
        style={{
          minHeight: 56,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <Text
          style={{
            flex: 1,
            fontFamily: 'GolosText_500Medium',
            fontSize: 15,
            color: colors.text,
          }}
        >
          {t('doctor_profile.privacy_analytics')}
        </Text>
        <PremiumToggle value={analytics} onChange={(next) => onChange({ privacyAnalytics: next })} />
      </View>
    </ProfileSheet>
  );
}
