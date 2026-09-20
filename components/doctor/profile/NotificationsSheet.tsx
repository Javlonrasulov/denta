import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { Text } from '@/components/ui/Text';
import type { DoctorNotificationKey, DoctorNotificationSettings } from '@/types';
import { NOTIFICATION_KEYS } from '@/utils/doctorProfile';
import { PremiumToggle } from './PremiumToggle';
import { ProfileSheet } from './ProfileSheet';

const LABEL: Record<DoctorNotificationKey, string> = {
  newAppointment: 'doctor_profile.notify_new',
  cancelledAppointment: 'doctor_profile.notify_cancel',
  appointmentReminder: 'doctor_profile.notify_reminder',
  patientRescheduled: 'doctor_profile.notify_reschedule',
  payment: 'doctor_profile.notify_payment',
  clinicMessages: 'doctor_profile.notify_clinic',
};

export function NotificationsSheet({
  visible,
  settings,
  onClose,
  onChange,
}: {
  visible: boolean;
  settings: DoctorNotificationSettings;
  onClose: () => void;
  onChange: (key: keyof DoctorNotificationSettings, value: boolean) => void;
}) {
  const { t } = useTranslation();
  const { colors, hairline } = useLoginTheme();

  return (
    <ProfileSheet visible={visible} onClose={onClose} title={t('doctor_profile.notify_title')}>
      <View>
        {NOTIFICATION_KEYS.map((key, index) => (
          <View
            key={key}
            style={{
              minHeight: 56,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              borderBottomWidth: index === NOTIFICATION_KEYS.length - 1 ? 0 : 1,
              borderBottomColor: hairline,
            }}
          >
            <Text
              style={{
                flex: 1,
                fontFamily: 'GolosText_500Medium',
                fontSize: 15,
                lineHeight: 21,
                color: colors.text,
              }}
            >
              {t(LABEL[key])}
            </Text>
            <PremiumToggle value={settings[key]} onChange={(next) => onChange(key, next)} />
          </View>
        ))}
      </View>
    </ProfileSheet>
  );
}
