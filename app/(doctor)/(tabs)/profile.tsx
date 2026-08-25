import { router } from 'expo-router';
import { LogOut } from '@/components/icons';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui/Text';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/theme';

export default function DoctorProfileScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius } = useTheme();
  const logout = useSettingsStore((s) => s.logout);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.md,
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing['5xl'],
        gap: spacing.xl,
      }}
    >
      <Text variant="h1">{t('tabs.profile')}</Text>
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          padding: spacing.xl,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          gap: spacing.sm,
        }}
      >
        <Text variant="h2">Dr. Alisher Aliyev</Text>
        <Text variant="body" muted>
          Therapist · Smile Dental
        </Text>
        <Text variant="bodySmall" muted>
          {t('doctor_app.working_hours')}: 09:00–18:00
        </Text>
      </View>

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
    </ScrollView>
  );
}
