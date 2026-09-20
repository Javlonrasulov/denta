import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { Text } from '@/components/ui/Text';
import { ProfileSheet } from './ProfileSheet';

export function LogoutConfirmSheet({
  visible,
  title,
  body,
  confirmLabel,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  const { colors, field, hairline, isDark } = useLoginTheme();

  return (
    <ProfileSheet visible={visible} onClose={onClose} title={title} subtitle={body} scroll={false}>
      <View style={{ gap: 8, paddingTop: 4 }}>
        <ScalePressable
          accessibilityLabel={confirmLabel ?? t('doctor_profile.logout_confirm')}
          onPress={onConfirm}
          style={{
            height: 52,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.error,
          }}
        >
          <Text
            style={{
              fontFamily: 'Geologica_600SemiBold',
              fontSize: 16,
              color: '#FFFFFF',
            }}
          >
            {confirmLabel ?? t('doctor_profile.logout_confirm')}
          </Text>
        </ScalePressable>
        <ScalePressable
          accessibilityLabel={t('common.cancel')}
          onPress={onClose}
          style={{
            height: 52,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: field,
            borderWidth: 1,
            borderColor: hairline,
          }}
        >
          <Text
            style={{
              fontFamily: 'GolosText_600SemiBold',
              fontSize: 15,
              color: isDark ? colors.text : colors.textSecondary,
            }}
          >
            {t('common.cancel')}
          </Text>
        </ScalePressable>
      </View>
    </ProfileSheet>
  );
}
