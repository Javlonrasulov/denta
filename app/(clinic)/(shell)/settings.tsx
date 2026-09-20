import { router } from 'expo-router';
import { LogOut } from '@/components/icons';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppShell } from '@/components/layout/AppShell';
import { Section } from '@/components/crm';
import { Text } from '@/components/ui/Text';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/theme';

export default function ClinicSettingsScreen() {
  const { t } = useTranslation();
  const { colors, spacing, radius } = useTheme();
  const logout = useSettingsStore((s) => s.logout);


  return (
    <AppShell title={t('crm.settings.title')} subtitle={t('crm.settings.subtitle')}>
      <View style={{ gap: spacing.xl, maxWidth: 560 }}>
        <Section title={t('crm.settings.clinic_section', { defaultValue: 'Clinic' })}>
          <Text variant="body" muted>
            {t('common.tagline')}
          </Text>
          <Text variant="caption" muted style={{ marginTop: spacing.sm }}>
            {t('profile.version', { version: '1.0.0' })}
          </Text>
        </Section>

        <Pressable
          onPress={() => {
            logout();
            router.replace('/login');
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
            paddingVertical: spacing.lg,
            borderRadius: radius.lg,
            backgroundColor: colors.errorMuted,
          }}
        >
          <LogOut size={18} color={colors.error} />
          <Text variant="label" color={colors.error}>
            {t('profile.logout')}
          </Text>
        </Pressable>
      </View>
    </AppShell>
  );
}
