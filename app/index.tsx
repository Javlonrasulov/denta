import { Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Building2, Stethoscope, UserRound } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { Text } from '@/components/ui/Text';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/theme';
import { UserRole } from '@/types';

const ROLES: {
  role: UserRole;
  icon: typeof UserRound;
  titleKey: string;
  descKey: string;
  href: '/(client)/(tabs)' | '/(doctor)/(tabs)' | '/(clinic)/(tabs)';
}[] = [
  {
    role: 'client',
    icon: UserRound,
    titleKey: 'role.client',
    descKey: 'role.client_desc',
    href: '/(client)/(tabs)',
  },
  {
    role: 'doctor',
    icon: Stethoscope,
    titleKey: 'role.doctor',
    descKey: 'role.doctor_desc',
    href: '/(doctor)/(tabs)',
  },
  {
    role: 'clinic',
    icon: Building2,
    titleKey: 'role.clinic',
    descKey: 'role.clinic_desc',
    href: '/(clinic)/(tabs)',
  },
];

export default function RoleGateScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius, shadows } = useTheme();
  const role = useSettingsStore((s) => s.role);
  const setRole = useSettingsStore((s) => s.setRole);

  if (role === 'client') return <Redirect href="/(client)/(tabs)" />;
  if (role === 'doctor') return <Redirect href="/(doctor)/(tabs)" />;
  if (role === 'clinic') return <Redirect href="/(clinic)/(tabs)" />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={[colors.primary, '#0F2D56']}
        style={{
          paddingTop: insets.top + spacing['3xl'],
          paddingBottom: spacing['4xl'],
          paddingHorizontal: spacing['2xl'],
        }}
      >
        <Animated.View entering={FadeInUp.springify()}>
          <Text variant="display" color={colors.textInverse}>
            {t('common.app_name')}
          </Text>
          <Text
            variant="bodyLarge"
            color="rgba(255,255,255,0.82)"
            style={{ marginTop: spacing.sm, maxWidth: 300 }}
          >
            {t('role.choose_role')}
          </Text>
        </Animated.View>
      </LinearGradient>

      <View
        style={{
          flex: 1,
          marginTop: -spacing['2xl'],
          paddingHorizontal: spacing.xl,
          gap: spacing.md,
        }}
      >
        {ROLES.map((item, index) => {
          const Icon = item.icon;
          return (
            <Animated.View key={item.role} entering={FadeInDown.delay(120 * index).springify()}>
              <Pressable
                onPress={() => setRole(item.role)}
                accessibilityRole="button"
                accessibilityLabel={t(item.titleKey)}
                style={({ pressed }) => ({
                  backgroundColor: colors.surface,
                  borderRadius: radius.xl,
                  padding: spacing.xl,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.lg,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  opacity: pressed ? 0.94 : 1,
                  ...shadows.md,
                })}
              >
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: radius.lg,
                    backgroundColor: colors.primaryMuted,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={24} color={colors.primary} strokeWidth={1.75} />
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
