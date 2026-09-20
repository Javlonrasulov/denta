import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { useLoginTheme } from '@/components/auth/loginTheme';
import { Text } from '@/components/ui/Text';
import { useSettingsStore } from '@/store/settingsStore';
import { ProfileSheet } from './ProfileSheet';

function Field({
  label,
  value,
  onChangeText,
  secure,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secure?: boolean;
}) {
  const { colors, field, hairline } = useLoginTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text variant="label" color={colors.textSecondary}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure}
        placeholderTextColor={colors.textMuted}
        style={{
          height: 48,
          borderRadius: 14,
          paddingHorizontal: 14,
          backgroundColor: field,
          borderWidth: 1,
          borderColor: hairline,
          color: colors.text,
          fontFamily: 'GolosText_400Regular',
          fontSize: 15,
        }}
      />
    </View>
  );
}

export function ChangePasswordSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useLoginTheme();
  const updateCredentials = useSettingsStore((s) => s.updateCredentials);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setCurrent('');
    setNext('');
    setConfirm('');
    setError(null);
    onClose();
  };

  const submit = () => {
    if (!current.trim()) {
      setError(t('auth.current_password_required'));
      return;
    }
    if (next.length > 0 && next.length < 4) {
      setError(t('auth.invalid_password'));
      return;
    }
    if (next !== confirm) {
      setError(t('auth.password_mismatch'));
      return;
    }
    const result = updateCredentials({
      currentPassword: current,
      newPassword: next,
    });
    if (!result.ok) {
      setError(t(result.error === 'weak_password' ? 'auth.invalid_password' : 'auth.wrong_password'));
      return;
    }
    close();
  };

  return (
    <ProfileSheet visible={visible} onClose={close} title={t('doctor_profile.password_title')}>
      <Field label={t('auth.current_password')} value={current} onChangeText={setCurrent} secure />
      <Field label={t('auth.new_password')} value={next} onChangeText={setNext} secure />
      <Field label={t('auth.confirm_password')} value={confirm} onChangeText={setConfirm} secure />
      {error ? (
        <Text variant="caption" color={colors.error}>
          {error}
        </Text>
      ) : null}
      <PrimaryButton title={t('common.save')} onPress={submit} />
    </ProfileSheet>
  );
}
