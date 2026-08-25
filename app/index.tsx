import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Building2, Stethoscope, UserRound } from '@/components/icons';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { APP_DISPLAY_NAME, APP_VARIANT, LOCKED_ROLE, roleHomeHref } from '@/constants/appVariant';
import { Text } from '@/components/ui/Text';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/theme';
import { UserRole } from '@/types';

const ROLES: {
  role: UserRole;
  icon: typeof UserRound;
  titleKey: string;
  descKey: string;
}[] = [
  {
    role: 'client',
    icon: UserRound,
    titleKey: 'role.client',
    descKey: 'role.client_desc',
  },
  {
    role: 'doctor',
    icon: Stethoscope,
    titleKey: 'role.doctor',
    descKey: 'role.doctor_desc',
  },
  {
    role: 'clinic',
    icon: Building2,
    titleKey: 'role.clinic',
    descKey: 'role.clinic_desc',
  },
];

export default function RoleGateScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius, shadows } = useTheme();
  const role = useSettingsStore((s) => s.role);
  const setRole = useSettingsStore((s) => s.setRole);
  const isAuthenticated = useSettingsStore((s) => s.isAuthenticated);

  // Client / Doctor APK: lock role automatically (no picker).
  useEffect(() => {
    if (!isAuthenticated || !LOCKED_ROLE) return;
    if (role !== LOCKED_ROLE) setRole(LOCKED_ROLE);
  }, [isAuthenticated, role, setRole]);

  if (!isAuthenticated) return <Redirect href="/login" />;

  if (LOCKED_ROLE) {
    return <Redirect href={roleHomeHref(LOCKED_ROLE)} />;
  }

  if (role === 'client') return <Redirect href="/(client)/(tabs)" />;
  if (role === 'doctor') return <Redirect href="/(doctor)/(tabs)" />;
  if (role === 'clinic') return <Redirect href="/(clinic)/(shell)/overview" />;

  const visibleRoles =
    APP_VARIANT === 'clinic' ? ROLES : ROLES.filter((r) => r.role === APP_VARIANT);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: insets.top + spacing['3xl'],
          paddingBottom: spacing['3xl'],
          paddingHorizontal: spacing['2xl'],
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderSubtle,
        }}
      >
        <Animated.View entering={FadeInUp.springify()}>
          <Text variant="display" color={colors.primary}>
            {APP_DISPLAY_NAME}
          </Text>
          <Text
            variant="body"
            color={colors.textSecondary}
            style={{ marginTop: spacing.sm, maxWidth: 320 }}
          >
            {t('common.tagline')}
          </Text>
          <Text variant="bodySmall" muted style={{ marginTop: spacing.md }}>
            {t('role.choose_role')}
          </Text>
        </Animated.View>
      </View>

      <View
        style={{
          flex: 1,
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.xl,
          gap: spacing.md,
        }}
      >
        {visibleRoles.map((item, index) => {
          const Icon = item.icon;
          return (
            <Animated.View key={item.role} entering={FadeInDown.delay(80 * index).springify()}>
              <Pressable
                onPress={() => setRole(item.role)}
                accessibilityRole="button"
                accessibilityLabel={t(item.titleKey)}
                style={({ pressed }) => ({
                  backgroundColor: colors.surface,
                  borderRadius: radius.lg,
                  padding: spacing.xl,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.lg,
                  borderWidth: 1,
                  borderColor: pressed ? colors.primary : colors.borderSubtle,
                  opacity: pressed ? 0.96 : 1,
                  ...shadows.sm,
                })}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: radius.md,
                    backgroundColor: colors.primaryMuted,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={22} color={colors.primary} strokeWidth={1.75} />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text variant="h3">{t(item.titleKey)}</Text>
                  <Text variant="bodySmall" muted>
                    {t(item.descKey)}
                  </Text>
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}
