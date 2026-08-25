import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { X } from '@/components/icons';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/theme';

interface CredentialsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CredentialsModal({ visible, onClose }: CredentialsModalProps) {
  const { t } = useTranslation();
  const { colors, spacing, radius, shadows } = useTheme();
  const adminLogin = useSettingsStore((s) => s.adminLogin);
  const updateCredentials = useSettingsStore((s) => s.updateCredentials);

  const [login, setLogin] = useState(adminLogin);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLogin(adminLogin);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    setSaving(false);
  }, [visible, adminLogin]);

  const handleSave = () => {
    setError('');
    setSuccess('');

    if (!currentPassword.trim()) {
      setError(t('auth.current_password_required'));
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setError(t('auth.password_mismatch'));
      return;
    }

    setSaving(true);
    const result = updateCredentials({
      login: login.trim(),
      currentPassword: currentPassword.trim(),
      newPassword: newPassword.trim() || undefined,
    });

    setSaving(false);

    if (!result.ok) {
      setError(
        result.error === 'wrong_password'
          ? t('auth.wrong_password')
          : t('auth.invalid_password'),
      );
      return;
    }

    setSuccess(t('auth.credentials_saved'));
    setTimeout(() => onClose(), 400);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: colors.overlay,
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing.xl,
        }}
      >
        <Pressable style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} onPress={onClose} />
        <View
          style={{
            width: '100%',
            maxWidth: 420,
            backgroundColor: colors.surface,
            borderRadius: radius.xl,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            padding: spacing['2xl'],
            gap: spacing.lg,
            ...shadows.lg,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md }}>
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Text variant="h2">{t('auth.credentials_title')}</Text>
              <Text variant="bodySmall" muted>
                {t('auth.credentials_subtitle')}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              style={{
                width: 36,
                height: 36,
                borderRadius: radius.md,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.surfaceSoft,
              }}
            >
              <X size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={{ gap: spacing.lg }}>
              <Input
                label={t('auth.login')}
                value={login}
                onChangeText={setLogin}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder={adminLogin || 'admin@denta.uz'}
              />
              <Input
                label={t('auth.current_password')}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                placeholder="••••••••"
              />
              <Input
                label={t('auth.new_password')}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="••••••••"
              />
              <Input
                label={t('auth.confirm_password')}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="••••••••"
              />

              {error ? (
                <View
                  style={{
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    borderRadius: radius.md,
                    backgroundColor: colors.errorMuted,
                    borderWidth: 1,
                    borderColor: colors.error,
                  }}
                >
                  <Text variant="caption" color={colors.error}>
                    {error}
                  </Text>
                </View>
              ) : null}
              {success ? (
                <View
                  style={{
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    borderRadius: radius.md,
                    backgroundColor: colors.successMuted,
                    borderWidth: 1,
                    borderColor: colors.success,
                  }}
                >
                  <Text variant="caption" color={colors.success}>
                    {success}
                  </Text>
                </View>
              ) : null}
            </View>
          </ScrollView>

          <View style={{ flexDirection: 'row', gap: spacing.sm, justifyContent: 'flex-end' }}>
            <Button title={t('common.cancel')} variant="outline" onPress={onClose} disabled={saving} />
            <Button title={t('common.save')} onPress={handleSave} loading={saving} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
