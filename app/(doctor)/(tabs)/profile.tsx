import { router } from 'expo-router';
import { LogOut } from '@/components/icons';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MobileCard, MobileHeader, MobileScreen } from '@/components/mobile';
import { Avatar } from '@/components/ui/Avatar';
import { Text } from '@/components/ui/Text';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/theme';

export default function DoctorProfileScreen() {
  const { t } = useTranslation();
  const { colors, spacing, radius } = useTheme();
  const logout = useSettingsStore((s) => s.logout);

  return (
    <MobileScreen contentStyle={{ gap: spacing.xl }}>
      <MobileHeader title={t('tabs.profile')} />

      <MobileCard>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
          <Avatar name="Dr. Alisher Aliyev" size={64} />
          <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
            <Text variant="h3" numberOfLines={1}>
              Dr. Alisher Aliyev
            </Text>
            <Text variant="bodySmall" muted>
              Therapist · Smile Dental
            </Text>
            <Text variant="caption" muted>
              {t('doctor_app.working_hours')}: 09:00–18:00
            </Text>
          </View>
        </View>
      </MobileCard>

      <Pressable
        onPress={() => {
          logout();
          router.replace('/login');
        }}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          paddingVertical: spacing.lg,
          borderRadius: radius.xl,
          backgroundColor: pressed ? colors.errorMuted : colors.surface,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
        })}
      >
        <LogOut size={16} color={colors.error} strokeWidth={1.8} />
        <Text variant="label" color={colors.error}>
          {t('profile.logout')}
        </Text>
      </Pressable>
    </MobileScreen>
  );
}
