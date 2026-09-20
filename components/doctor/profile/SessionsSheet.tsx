import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { Smartphone } from '@/components/icons';
import { Text } from '@/components/ui/Text';
import type { DoctorDeviceSession } from '@/types';
import { ProfileSheet } from './ProfileSheet';

export function SessionsSheet({
  visible,
  sessions,
  onClose,
}: {
  visible: boolean;
  sessions: DoctorDeviceSession[];
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { colors, field, hairline } = useLoginTheme();

  const lastActive = (item: DoctorDeviceSession) => {
    if (item.lastActiveKey === 'now') return t('doctor_profile.session_now');
    if (item.lastActiveKey === 'hours') {
      return t('doctor_profile.session_hours', { n: item.lastActiveCount ?? 1 });
    }
    return t('doctor_profile.session_days', { n: item.lastActiveCount ?? 1 });
  };

  return (
    <ProfileSheet visible={visible} onClose={onClose} title={t('doctor_profile.sessions_title')}>
      <View style={{ gap: 8 }}>
        {sessions.map((item) => (
          <View
            key={item.id}
            style={{
              minHeight: 64,
              borderRadius: 16,
              paddingHorizontal: 14,
              paddingVertical: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              backgroundColor: field,
              borderWidth: 1,
              borderColor: item.current ? colors.primary : hairline,
            }}
          >
            <Smartphone size={18} color={item.current ? colors.primary : colors.textSecondary} strokeWidth={1.8} />
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: 'GolosText_600SemiBold',
                  fontSize: 14,
                  color: colors.text,
                }}
              >
                {item.device}
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: 'GolosText_400Regular',
                  fontSize: 12,
                  color: colors.textMuted,
                }}
              >
                {item.location} · {lastActive(item)}
              </Text>
            </View>
            {item.current ? (
              <Text
                style={{
                  fontFamily: 'GolosText_600SemiBold',
                  fontSize: 11,
                  color: colors.primary,
                }}
              >
                {t('doctor_profile.session_this')}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
    </ProfileSheet>
  );
}
