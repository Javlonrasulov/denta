import { useEffect, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { useLoginTheme } from '@/components/auth/loginTheme';
import { ProfileSheet } from '@/components/doctor/profile/ProfileSheet';
import { Text } from '@/components/ui/Text';
import { ApiError } from '@/services/apiClient';
import { authErrorMessage, changeAccountPhone } from '@/services/authService';
import { useToastStore } from '@/store/toastStore';
import { useUserStore } from '@/store/userStore';
import { ProfileFormField } from './ProfileFormField';

export function ChangePhoneSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useLoginTheme();
  const showToast = useToastStore((s) => s.showToast);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setPhone(useUserStore.getState().phone || '+998 ');
    setPassword('');
    setError(null);
  }, [visible]);

  const submit = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 9 || digits.length > 15) {
      setError(t('profile.phone_invalid'));
      return;
    }
    if (!password) {
      setError(t('auth.current_password_required'));
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await changeAccountPhone(phone.trim(), password);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast({ tone: 'success', title: t('profile.saved'), message: t('profile.phone_saved') });
      onClose();
    } catch (err) {
      const code = err instanceof ApiError ? err.code : undefined;
      setError(code === 'WRONG_PASSWORD' ? t('auth.wrong_password') : authErrorMessage(err, t));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProfileSheet
      visible={visible}
      onClose={saving ? () => undefined : onClose}
      title={t('profile.phone_change_title')}
      subtitle={t('profile.phone_change_subtitle')}
      footer={
        <PrimaryButton
          title={t('common.save')}
          onPress={() => void submit()}
          loading={saving}
          disabled={saving}
        />
      }
    >
      <ProfileFormField
        label={t('profile.phone_new')}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        autoComplete="tel"
        maxLength={20}
      />
      <ProfileFormField
        label={t('auth.current_password')}
        value={password}
        onChangeText={setPassword}
        secure
        autoCapitalize="none"
        autoCorrect={false}
      />
      {error ? (
        <Text variant="caption" color={colors.error}>
          {error}
        </Text>
      ) : null}
    </ProfileSheet>
  );
}
