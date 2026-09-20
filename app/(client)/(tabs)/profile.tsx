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
import { Pressable, Switch, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MobileCard, MobileHeader, MobileScreen } from '@/components/mobile';
import { Avatar } from '@/components/ui/Avatar';
import { Text } from '@/components/ui/Text';
import { useSettingsStore } from '@/store/settingsStore';
import { useUserStore } from '@/store/userStore';
import { useTheme } from '@/theme';
import { LocaleCode } from '@/types';

const LOCALES: { code: LocaleCode; label: string; flag: string }[] = [
  { code: 'uz', label: 'O‘zbekcha', flag: '🇺🇿' },
  { code: 'uz-Cyrl', label: 'Ўзбекча', flag: '🇺🇿' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { colors, spacing, radius } = useTheme();
  const user = useUserStore();
  const {
    locale,
    setLocale,
    themeMode,
    setThemeMode,
    notificationsEnabled,
    setNotificationsEnabled,
  } = useSettingsStore();
  const isDark = themeMode === 'dark';

  const Row = ({
    icon: Icon,
    label,
    onPress,
    right,
    last,
  }: {
    icon: typeof Globe;
    label: string;
    onPress?: () => void;
    right?: React.ReactNode;
    last?: boolean;
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
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.borderSubtle,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: radius.md,
          backgroundColor: colors.surfaceSoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={16} color={colors.primary} strokeWidth={1.8} />
      </View>
      <Text variant="body" style={{ flex: 1 }}>
        {label}
      </Text>
      {right ?? <ChevronRight size={16} color={colors.textMuted} strokeWidth={1.8} />}
    </Pressable>
  );

  return (
    <MobileScreen>
      <MobileHeader title={t('profile.title')} />

      <MobileCard style={{ marginBottom: spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
          <Avatar uri={user.avatarUrl} name={user.fullName} size={64} />
          <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
            <Text variant="h3" numberOfLines={1}>
              {user.fullName}
            </Text>
            <Text variant="bodySmall" muted>
              {user.phone}
            </Text>
          </View>
        </View>
      </MobileCard>

      <MobileCard style={{ marginBottom: spacing.lg }} padded={false}>
        <View style={{ paddingHorizontal: spacing.lg }}>
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
          <Row icon={CircleHelp} label={t('profile.help')} onPress={() => undefined} last />
        </View>
      </MobileCard>

      <MobileCard style={{ marginBottom: spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
          <Globe size={16} color={colors.primary} strokeWidth={1.8} />
          <Text variant="label">{t('profile.language')}</Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {LOCALES.map((item) => (
            <Pressable
              key={item.code}
              onPress={() => setLocale(item.code)}
              style={{
                paddingHorizontal: spacing.lg,
                paddingVertical: 10,
                borderRadius: radius.full,
                backgroundColor: locale === item.code ? colors.primary : colors.surfaceSoft,
                borderWidth: 1,
                borderColor: locale === item.code ? colors.primary : colors.borderSubtle,
              }}
            >
              <Text
                variant="caption"
                weight="semibold"
                color={locale === item.code ? colors.textInverse : colors.textSecondary}
              >
                {item.flag} {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </MobileCard>

      <Pressable
        onPress={() => {
          void (async () => {
            const { logout: apiLogout } = await import('@/services/authService');
            await apiLogout();
            router.replace('/login');
          })();
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

      <Text variant="caption" muted center style={{ marginTop: spacing.xl }}>
        {t('profile.version', { version: '1.0.0' })}
      </Text>
    </MobileScreen>
  );
}
