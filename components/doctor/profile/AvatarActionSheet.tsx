import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { Camera, ImageIcon, Trash2 } from '@/components/icons';
import { Text } from '@/components/ui/Text';
import { ProfileSheet } from './ProfileSheet';

export function AvatarActionSheet({
  visible,
  canRemove,
  onClose,
  onCamera,
  onLibrary,
  onRemove,
}: {
  visible: boolean;
  canRemove: boolean;
  onClose: () => void;
  onCamera: () => void;
  onLibrary: () => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const { colors, field, hairline, isDark } = useLoginTheme();

  const Action = ({
    icon: Icon,
    label,
    onPress,
    danger,
  }: {
    icon: typeof Camera;
    label: string;
    onPress: () => void;
    danger?: boolean;
  }) => (
    <ScalePressable
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        minHeight: 54,
        borderRadius: 14,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: danger ? (isDark ? 'rgba(251,113,133,0.1)' : 'rgba(239,68,68,0.08)') : field,
        borderWidth: 1,
        borderColor: danger ? colors.error : hairline,
      }}
    >
      <Icon size={18} color={danger ? colors.error : colors.primary} strokeWidth={1.9} />
      <Text
        style={{
          fontFamily: 'GolosText_600SemiBold',
          fontSize: 15,
          color: danger ? colors.error : colors.text,
        }}
      >
        {label}
      </Text>
    </ScalePressable>
  );

  return (
    <ProfileSheet
      visible={visible}
      onClose={onClose}
      title={t('doctor_profile.avatar_change')}
      scroll={false}
    >
      <View style={{ gap: 8 }}>
        <Action icon={Camera} label={t('doctor_profile.avatar_camera')} onPress={onCamera} />
        <Action icon={ImageIcon} label={t('doctor_profile.avatar_gallery')} onPress={onLibrary} />
        {canRemove ? (
          <Action icon={Trash2} label={t('doctor_profile.avatar_remove')} onPress={onRemove} danger />
        ) : null}
      </View>
    </ProfileSheet>
  );
}
