import { router } from 'expo-router';
import {
  Bell,
  ChevronRight,
  CircleHelp,
  Globe,
  LogOut,
  Moon,
  Shield,
  UserRound,
} from '@/components/icons';
import { Pressable, ScrollView, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Avatar } from '@/components/ui/Avatar';
import { Text } from '@/components/ui/Text';
import { useSettingsStore } from '@/store/settingsStore';
import { useUserStore } from '@/store/userStore';
import { useTheme } from '@/theme';
import { LocaleCode } from '@/types';

const LOCALES: { code: LocaleCode; label: string }[] = [
  { code: 'uz', label: 'O‘zbekcha' },
  { code: 'uz-Cyrl', label: 'Ўзбекча' },
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
];

export default function ProfileScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius, shadows } = useTheme();
  const user = useUserStore();
  const {
    locale,
    setLocale,
    themeMode,
    setThemeMode,
    notificationsEnabled,
    setNotificationsEnabled,
    logout,
  } = useSettingsStore();

  const isDark = themeMode === 'dark';

  const Row = ({
    icon: Icon,
    label,
    onPress,
    right,
  }: {
    icon: typeof Globe;
    label: string;
    onPress?: () => void;
    right?: React.ReactNode;
  }) => (
    <Pressable
      onPress={onPress}
      disabled={!onPress && !right}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.md + 2,
        minHeight: 52,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.md,
          backgroundColor: colors.surfaceSoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={18} color={colors.primary} />
      </View>
      <Text variant="body" style={{ flex: 1 }}>
        {label}
      </Text>
      {right ?? <ChevronRight size={18} color={colors.textMuted} />}
    </Pressable>
  );

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
      <Text variant="h1">{t('profile.title')}</Text>

      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          padding: spacing.xl,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.lg,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          ...shadows.sm,
        }}
      >
        <Avatar uri={user.avatarUrl} name={user.fullName} size={64} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text variant="h3">{user.fullName}</Text>
          <Text variant="bodySmall" muted>
            {user.phone}
          </Text>
        </View>
      </View>

      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          paddingHorizontal: spacing.lg,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
        }}
      >
        <Row icon={UserRound} label={t('profile.personal_info')} onPress={() => undefined} />
        <Row
          icon={Bell}
          label={t('profile.notifications')}
          right={
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          }
        />
        <Row
          icon={Moon}
          label={t('profile.dark_mode')}
          right={
            <Switch
              value={isDark}
              onValueChange={(v) => setThemeMode(v ? 'dark' : 'light')}
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          }
        />
        <Row icon={Shield} label={t('profile.privacy')} onPress={() => undefined} />
        <Row icon={CircleHelp} label={t('profile.help')} onPress={() => undefined} />
      </View>

      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          padding: spacing.lg,
          gap: spacing.md,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Globe size={18} color={colors.primary} />
          <Text variant="label">{t('profile.language')}</Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {LOCALES.map((item) => (
            <Pressable
              key={item.code}
              onPress={() => setLocale(item.code)}
              style={{
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.sm,
                borderRadius: radius.full,
                backgroundColor: locale === item.code ? colors.primary : colors.surfaceSoft,
              }}
            >
              <Text
                variant="label"
                color={locale === item.code ? colors.textInverse : colors.textSecondary}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
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

      <Text variant="caption" muted center>
        {t('profile.version', { version: '1.0.0' })}
      </Text>
    </ScrollView>
  );
}
