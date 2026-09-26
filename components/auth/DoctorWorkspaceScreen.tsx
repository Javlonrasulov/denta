import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { Text } from '@/components/ui/Text';
import { switchWorkspace } from '@/services/authService';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/theme';

export function DoctorWorkspaceScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius } = useTheme();
  const workspaces = useSettingsStore((s) => s.workspaces);
  const active = useSettingsStore((s) => s.activeWorkspace);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function select(clinicId: string) {
    setBusy(true);
    setError('');
    try {
      await switchWorkspace(clinicId);
      router.replace('/');
    } catch {
      setError(t('auth.errors.generic'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + spacing.lg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}>
        <Text variant="h2">{t('auth.workspace_title', { defaultValue: 'Qaysi klinikada ishlamoqchisiz?' })}</Text>
        <Text variant="body" muted>
          {t('auth.workspace_subtitle', {
            defaultValue: 'Bir nechta klinikaga bog‘langansiz. Davom etish uchun birini tanlang.',
          })}
        </Text>
        {workspaces.map((w) => (
          <Pressable
            key={w.membershipId}
            onPress={() => void select(w.clinicId)}
            disabled={busy}
            style={{
              padding: spacing.lg,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor:
                active?.clinicId === w.clinicId ? colors.primary : colors.border,
              backgroundColor: colors.surface,
            }}
          >
            <Text variant="body" weight="semibold">
              {w.clinicName}
            </Text>
            <Text variant="caption" muted>
              {w.role}
            </Text>
          </Pressable>
        ))}
        {error ? (
          <Text variant="caption" color={colors.error}>
            {error}
          </Text>
        ) : null}
        <PrimaryButton
          title={t('common.continue', { defaultValue: 'Davom etish' })}
          loading={busy}
          onPress={() => {
            const id = active?.clinicId ?? workspaces[0]?.clinicId;
            if (id) void select(id);
          }}
        />
      </ScrollView>
    </View>
  );
}
