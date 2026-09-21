import { useState } from 'react';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import {
  ClientLanguageSection,
  ClientLogoutBlock,
  ClientProfileHeader,
  ClientProfileHero,
  ClientProfileSummary,
} from '@/components/client/profile';
import {
  LogoutConfirmSheet,
  PremiumToggle,
  ProfileSettingsRow,
  ProfileSettingsSection,
} from '@/components/doctor/profile';
import {
  Bell,
  CircleHelp,
  Mail,
  Moon,
  Shield,
  UserRound,
} from '@/components/icons';
import { tabBarBottomInset } from '@/components/mobile';
import { MobileScreen } from '@/components/mobile';
import { Text } from '@/components/ui/Text';
import { useLoginTheme } from '@/components/auth/loginTheme';
import { useAppointmentsStore } from '@/store/appointmentsStore';
import { useFavoritesStore, useUserStore } from '@/store/userStore';
import { useSettingsStore } from '@/store/settingsStore';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { canvas } = useLoginTheme();
  const insets = useSafeAreaInsets();
  const user = useUserStore();
  const appointments = useAppointmentsStore((s) => s.appointments);
  const clinicIds = useFavoritesStore((s) => s.clinicIds);
  const doctorIds = useFavoritesStore((s) => s.doctorIds);
  const {
    locale,
    setLocale,
    themeMode,
    setThemeMode,
    notificationsEnabled,
    setNotificationsEnabled,
    adminLogin,
    logout: clearSession,
  } = useSettingsStore();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const isDark = themeMode === 'dark';
  const email = (adminLogin.includes('@') ? adminLogin : '').trim().toLowerCase();
  const emailPending = Boolean(email);
  const favoritesCount = clinicIds.length + doctorIds.length;
  const bottomPad = tabBarBottomInset(insets.bottom) + 120;

  const doLogout = () => {
    setLogoutOpen(false);
    void (async () => {
      const { logout: apiLogout } = await import('@/services/authService');
      await apiLogout();
      clearSession();
      router.replace('/login');
    })();
  };

  return (
    <MobileScreen
      style={{ backgroundColor: canvas }}
      contentStyle={{ gap: 12, paddingTop: 4, paddingBottom: bottomPad }}
    >
      <ClientProfileHeader />

      <ClientProfileHero
        fullName={user.fullName}
        phone={user.phone}
        email={email || undefined}
        avatarUrl={user.avatarUrl || undefined}
        emailPending={emailPending}
        onEdit={() => undefined}
      />

      <ClientProfileSummary
        appointmentsCount={appointments.length}
        favoritesCount={favoritesCount}
        phone={user.phone}
        email={email || undefined}
        onAppointments={() => router.push('/(client)/(tabs)/appointments')}
        onFavorites={() => router.push('/(client)/(tabs)/favorites')}
      />

      <ProfileSettingsSection title={t('profile.section_account')}>
        <ProfileSettingsRow
          icon={UserRound}
          label={t('profile.personal_info')}
          value={
            user.fullName.trim()
              ? undefined
              : t('profile.profile_incomplete')
          }
          onPress={() => undefined}
        />
        {email ? (
          <ProfileSettingsRow
            icon={Mail}
            label={t('profile.verify_email')}
            value={t('profile.email_unverified_hint')}
            onPress={() =>
              router.push({
                pathname: '/verify-email',
                params: { email, cooldown: '0' },
              })
            }
            last
          />
        ) : (
          <ProfileSettingsRow
            icon={Mail}
            label={t('profile.verify_email')}
            value={t('profile.email_missing')}
            onPress={() => undefined}
            last
          />
        )}
      </ProfileSettingsSection>

      <ProfileSettingsSection title={t('profile.section_preferences')}>
        <ProfileSettingsRow
          icon={Bell}
          label={t('profile.notifications')}
          value={
            notificationsEnabled
              ? t('profile.notifications_on')
              : t('profile.notifications_off')
          }
          right={
            <PremiumToggle
              value={notificationsEnabled}
              onChange={setNotificationsEnabled}
            />
          }
        />
        <ProfileSettingsRow
          icon={Moon}
          label={t('profile.dark_mode')}
          value={
            isDark ? t('profile.dark_mode_on') : t('profile.dark_mode_off')
          }
          right={
            <PremiumToggle
              value={isDark}
              onChange={(v) => setThemeMode(v ? 'dark' : 'light')}
            />
          }
          last
        />
      </ProfileSettingsSection>

      <ClientLanguageSection locale={locale} onSelect={setLocale} />

      <ProfileSettingsSection title={t('profile.section_support')}>
        <ProfileSettingsRow
          icon={Shield}
          label={t('profile.privacy')}
          value={t('profile.privacy_hint')}
          onPress={() => undefined}
        />
        <ProfileSettingsRow
          icon={CircleHelp}
          label={t('profile.help')}
          value={t('profile.help_hint')}
          onPress={() => undefined}
          last
        />
      </ProfileSettingsSection>

      <ClientLogoutBlock onPress={() => setLogoutOpen(true)} />

      <View style={{ paddingTop: 4, paddingBottom: 8 }}>
        <Text
          center
          maxFontSizeMultiplier={1}
          style={{
            fontFamily: 'GolosText_400Regular',
            fontSize: 12,
            lineHeight: 16,
            color: 'rgba(100,116,139,0.85)',
          }}
        >
          {t('profile.version_brand', { version: '1.0.0' })}
        </Text>
      </View>

      <LogoutConfirmSheet
        visible={logoutOpen}
        title={t('profile.logout_title')}
        body={t('profile.logout_body')}
        confirmLabel={t('profile.logout_confirm')}
        onClose={() => setLogoutOpen(false)}
        onConfirm={doLogout}
      />
    </MobileScreen>
  );
}
