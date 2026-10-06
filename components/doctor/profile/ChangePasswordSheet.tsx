import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { useLoginTheme } from '@/components/auth/loginTheme';
import { Text } from '@/components/ui/Text';
import { ApiError } from '@/services/apiClient';
import {
  authErrorMessage,
  changePassword,
  isValidStaffPassword,
} from '@/services/authService';
import { useToastStore } from '@/store/toastStore';
import { ProfileSheet } from './ProfileSheet';

function Field({
  label,
  value,
  onChangeText,
  secure,
  hint,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secure?: boolean;
  hint?: string;
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
        autoCapitalize="none"
        autoCorrect={false}
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
      {hint ? (
        <Text variant="caption" color={colors.textMuted}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

export function ChangePasswordSheet({
  visible,
  onClose,
  forced = false,
}: {
  visible: boolean;
  onClose: () => void;
  /** First login with the clinic-issued default password. */
  forced?: boolean;
}) {
  const { t } = useTranslation();
  const { colors } = useLoginTheme();
  const showToast = useToastStore((s) => s.showToast);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const close = () => {
    if (saving) return;
    setCurrent('');
    setNext('');
    setConfirm('');
    setError(null);
    onClose();
  };

  const submit = async () => {
    if (!current.trim()) {
      setError(t('auth.current_password_required'));
      return;
    }
    if (!isValidStaffPassword(next)) {
      setError(t('doctor_profile.password_rules'));
      return;
    }
    if (next !== confirm) {
      setError(t('auth.password_mismatch'));
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await changePassword(current, next);
      showToast({
        tone: 'success',
        title: t('doctor_profile.saved'),
        message: t('doctor_profile.password_changed'),
      });
      setSaving(false);
      setCurrent('');
      setNext('');
      setConfirm('');
      onClose();
    } catch (err) {
      setSaving(false);
      const code = err instanceof ApiError ? err.code : undefined;
      if (code === 'WRONG_PASSWORD') setError(t('auth.wrong_password'));
      else if (code === 'INVALID_PASSWORD') setError(t('doctor_profile.password_rules'));
      else if (code === 'SAME_PASSWORD') setError(t('doctor_profile.password_same'));
      else setError(authErrorMessage(err, t));
    }
  };

  return (
    <ProfileSheet
      visible={visible}
      onClose={close}
      title={forced ? t('doctor_profile.password_force_title') : t('doctor_profile.password_title')}
      subtitle={forced ? t('doctor_profile.password_force_body') : undefined}
    >
      <Field
        label={t('auth.current_password')}
        value={current}
        onChangeText={setCurrent}
        secure
        hint={forced ? t('doctor_profile.password_force_current_hint') : undefined}
      />
      <Field
        label={t('auth.new_password')}
        value={next}
        onChangeText={setNext}
        secure
        hint={t('doctor_profile.password_rules')}
      />
      <Field label={t('auth.confirm_password')} value={confirm} onChangeText={setConfirm} secure />
      {error ? (
        <Text variant="caption" color={colors.error}>
          {error}
        </Text>
      ) : null}
      <PrimaryButton title={t('common.save')} onPress={() => void submit()} loading={saving} />
      {forced ? (
        <Pressable
          accessibilityRole="button"
          onPress={close}
          style={{ alignItems: 'center', paddingVertical: 8 }}
        >
          <Text variant="label" color={colors.textSecondary}>
            {t('doctor_profile.password_force_later')}
          </Text>
        </Pressable>
      ) : null}
    </ProfileSheet>
  );
}
