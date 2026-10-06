import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { useLoginTheme } from '@/components/auth/loginTheme';
import { ProfileSheet } from '@/components/doctor/profile/ProfileSheet';
import { Text } from '@/components/ui/Text';
import { ApiError } from '@/services/apiClient';
import {
  authErrorMessage,
  confirmAccountEmailChange,
  requestAccountEmailChange,
} from '@/services/authService';
import { useToastStore } from '@/store/toastStore';
import { useUserStore } from '@/store/userStore';
import { ProfileFormField } from './ProfileFormField';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function ChangeEmailSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useLoginTheme();
  const showToast = useToastStore((s) => s.showToast);
  const [step, setStep] = useState<'request' | 'confirm'>('request');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setStep('request');
    setEmail('');
    setPassword('');
    setCode('');
    setCooldown(0);
    setError(null);
  }, [visible]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const mapError = (err: unknown) => {
    const code = err instanceof ApiError ? err.code : undefined;
    if (code === 'WRONG_PASSWORD') return t('auth.wrong_password');
    if (code === 'SAME_EMAIL') return t('profile.email_same');
    return authErrorMessage(err, t);
  };

  const sendCode = async () => {
    const next = email.trim().toLowerCase();
    if (!EMAIL_RE.test(next)) {
      setError(t('profile.email_invalid'));
      return;
    }
    if (next === useUserStore.getState().email.trim().toLowerCase()) {
      setError(t('profile.email_same'));
      return;
    }
    if (!password) {
      setError(t('auth.current_password_required'));
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const res = await requestAccountEmailChange(next, password);
      setEmail(res.email || next);
      setCooldown(res.resendAvailableIn || 60);
      setCode('');
      setStep('confirm');
    } catch (err) {
      setError(mapError(err));
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!/^\d{6}$/.test(code)) {
      setError(t('auth.errors.invalid_otp'));
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await confirmAccountEmailChange(email, code);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast({ tone: 'success', title: t('profile.saved'), message: t('profile.email_saved') });
      onClose();
    } catch (err) {
      setError(mapError(err));
    } finally {
      setBusy(false);
    }
  };

  const isConfirm = step === 'confirm';

  return (
    <ProfileSheet
      visible={visible}
      onClose={busy ? () => undefined : onClose}
      title={t('profile.email_change_title')}
      subtitle={
        isConfirm
          ? t('profile.email_code_sent', { email })
          : t('profile.email_change_subtitle')
      }
      footer={
        <PrimaryButton
          title={isConfirm ? t('profile.confirm_code') : t('profile.send_code')}
          onPress={() => void (isConfirm ? confirm() : sendCode())}
          loading={busy}
          disabled={busy}
        />
      }
    >
      {isConfirm ? (
        <>
          <ProfileFormField
            label={t('profile.email_code')}
            value={code}
            onChangeText={(text) => setCode(text.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={6}
            placeholder="••••••"
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              disabled={busy}
              onPress={() => {
                setStep('request');
                setError(null);
              }}
            >
              <Text variant="label" color={colors.textSecondary}>
                {t('profile.change_email_address')}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              disabled={busy || cooldown > 0}
              onPress={() => void sendCode()}
            >
              <Text variant="label" color={cooldown > 0 ? colors.textMuted : colors.primary}>
                {cooldown > 0
                  ? t('profile.resend_in', { seconds: cooldown })
                  : t('profile.resend_code')}
              </Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <ProfileFormField
            label={t('profile.email_new')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            maxLength={254}
          />
          <ProfileFormField
            label={t('auth.current_password')}
            value={password}
            onChangeText={setPassword}
            secure
            autoCapitalize="none"
            autoCorrect={false}
          />
        </>
      )}
      {error ? (
        <Text variant="caption" color={colors.error}>
          {error}
        </Text>
      ) : null}
    </ProfileSheet>
  );
}
