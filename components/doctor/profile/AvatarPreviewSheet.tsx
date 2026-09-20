import { View } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { useLoginTheme } from '@/components/auth/loginTheme';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { Text } from '@/components/ui/Text';
import { ProfileSheet } from './ProfileSheet';

export function AvatarPreviewSheet({
  visible,
  uri,
  saving,
  onClose,
  onSave,
}: {
  visible: boolean;
  uri: string | null;
  saving?: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  const { t } = useTranslation();
  const { colors, hairline } = useLoginTheme();

  return (
    <ProfileSheet
      visible={visible}
      onClose={onClose}
      title={t('doctor_profile.avatar_preview')}
      scroll={false}
    >
      <View style={{ alignItems: 'center', gap: 18, paddingTop: 4 }}>
        <View
          style={{
            width: 168,
            height: 168,
            borderRadius: 84,
            overflow: 'hidden',
            borderWidth: 3,
            borderColor: hairline,
            backgroundColor: colors.primaryMuted,
          }}
        >
          {uri ? <Image source={{ uri }} style={{ width: 168, height: 168 }} contentFit="cover" /> : null}
        </View>
        <View style={{ width: '100%', gap: 8 }}>
          <PrimaryButton
            title={t('doctor_profile.avatar_use')}
            onPress={onSave}
            loading={saving}
          />
          <ScalePressable
            accessibilityLabel={t('common.cancel')}
            onPress={onClose}
            style={{
              height: 48,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontFamily: 'GolosText_600SemiBold',
                fontSize: 15,
                color: colors.textSecondary,
              }}
            >
              {t('common.cancel')}
            </Text>
          </ScalePressable>
        </View>
      </View>
    </ProfileSheet>
  );
}
