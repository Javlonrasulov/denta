import { useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { LanguageBottomSheet } from '@/components/auth/LanguageBottomSheet';
import { useLoginTheme } from '@/components/auth/loginTheme';
import {
  AvatarActionSheet,
  AvatarPreviewSheet,
  ChangePasswordSheet,
  ClinicProfileCard,
  ClinicProfileSheet,
  DoctorProfileHero,
  DurationSheet,
  EditDoctorProfileSheet,
  LogoutConfirmSheet,
  NotificationsSheet,
  PrivacySheet,
  ProfessionalInfo,
  ProfileBio,
  ProfileCompletion,
  ProfileHeader,
  ProfileSettingsRow,
  ProfileSettingsSection,
  ProfileSkeleton,
  ProfileStats,
  SessionsSheet,
  ThemeSelector,
  themeLabelKey,
  WorkSchedulePreview,
  PremiumToggle,
} from '@/components/doctor/profile';
import {
  Building2,
  Bell,
  CalendarDays,
  Clock,
  Fingerprint,
  Globe,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  Moon,
  ScanFace,
  Shield,
  Smartphone,
  UserRound,
} from '@/components/icons';
import { MobileScreen } from '@/components/mobile';
import { ErrorState } from '@/components/states/EmptyState';
import { Text } from '@/components/ui/Text';
import { LOCALE_OPTIONS } from '@/components/ui/LanguageMenu';
import { useDoctorProfile } from '@/hooks/useDoctorProfile';
import {
  getDoctorSessions,
  pickDoctorAvatar,
  uploadDoctorAvatar,
} from '@/services/doctorProfileService';
import { useSettingsStore } from '@/store/settingsStore';
import { useToastStore } from '@/store/toastStore';
import type { DoctorDeviceSession, UpdateDoctorProfileInput } from '@/types';

export default function DoctorProfileScreen() {
  const { t } = useTranslation();
  const { canvas } = useLoginTheme();
  const {
    profile,
    stats,
    completion,
    clinic,
    isLoading,
    isError,
    refetch,
    patchProfile,
    setNotification,
    biometricEnabled,
    setBiometricEnabled,
    privacyVisibleToClinic,
    privacyVisibleInSearch,
    privacyAnalytics,
    setPrivacy,
  } = useDoctorProfile();
  const locale = useSettingsStore((s) => s.locale);
  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const logout = useSettingsStore((s) => s.logout);
  const showToast = useToastStore((s) => s.showToast);

  const [editOpen, setEditOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [durationOpen, setDurationOpen] = useState(false);
  const [clinicOpen, setClinicOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [sessions, setSessions] = useState<DoctorDeviceSession[]>([]);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutAllOpen, setLogoutAllOpen] = useState(false);

  const languageLabel = LOCALE_OPTIONS.find((item) => item.code === locale)?.label ?? locale;

  const pickAvatar = (source: 'camera' | 'library') => {
    setAvatarOpen(false);
    setTimeout(() => {
      void (async () => {
        const result = await pickDoctorAvatar(source);
        if (!result.ok) {
          if (result.reason === 'permission') {
            showToast({
              tone: 'warning',
              title: t('doctor_profile.permission_denied'),
              message:
                source === 'camera'
                  ? t('doctor_profile.permission_camera')
                  : t('doctor_profile.permission_photos'),
            });
          }
          return;
        }
        setPreviewUri(result.uri);
      })();
    }, 280);
  };

  const saveAvatar = async () => {
    if (!previewUri) return;
    setSavingAvatar(true);
    try {
      const uploaded = await uploadDoctorAvatar(previewUri);
      patchProfile({ avatar: uploaded.uri });
      showToast({
        tone: 'success',
        title: t('doctor_profile.saved'),
        message: t('doctor_profile.avatar_updated'),
      });
      setPreviewUri(null);
    } finally {
      setSavingAvatar(false);
    }
  };

  const removeAvatar = () => {
    setAvatarOpen(false);
    patchProfile({ avatar: null });
    showToast({
      tone: 'info',
      title: t('doctor_profile.saved'),
      message: t('doctor_profile.avatar_removed'),
    });
  };

  const saveProfile = (patch: UpdateDoctorProfileInput) => {
    patchProfile(patch);
    showToast({
      tone: 'success',
      title: t('doctor_profile.saved'),
      message: t('doctor_profile.saved'),
    });
  };

  const doLogout = () => {
    setLogoutOpen(false);
    setLogoutAllOpen(false);
    logout();
    router.replace('/login');
  };

  const openSessions = async () => {
    const data = await getDoctorSessions();
    setSessions(data);
    setSessionsOpen(true);
  };

  if (isLoading) return <ProfileSkeleton />;
  if (isError || !profile || !stats || !completion) {
    return (
      <ErrorState
        title={t('error.something_wrong')}
        onRetry={refetch}
        retryLabel={t('common.retry')}
      />
    );
  }

  return (
    <MobileScreen
      style={{ backgroundColor: canvas }}
      contentStyle={{ gap: 18, paddingTop: 8 }}
      onRefresh={refetch}
    >
      <ProfileHeader onEdit={() => setEditOpen(true)} />
      <DoctorProfileHero profile={profile} onAvatar={() => setAvatarOpen(true)} />
      <ProfileCompletion completion={completion} />
      <ProfileStats stats={stats} />
      <ProfileBio bio={profile.bio} onEdit={() => setEditOpen(true)} />
      <ProfessionalInfo profile={profile} />
      <ClinicProfileCard profile={profile} onOpen={() => setClinicOpen(true)} />
      <WorkSchedulePreview
        schedule={profile.weeklySchedule}
        onManage={() => router.push('/(doctor)/(tabs)/calendar')}
      />

      <ProfileSettingsSection title={t('doctor_profile.section_account')}>
        <ProfileSettingsRow
          icon={UserRound}
          label={t('doctor_profile.personal')}
          onPress={() => setEditOpen(true)}
        />
        <ProfileSettingsRow
          icon={KeyRound}
          label={t('doctor_profile.change_password')}
          onPress={() => setPasswordOpen(true)}
        />
        <ProfileSettingsRow
          icon={Mail}
          label={t('doctor_profile.phone_email')}
          value={`${profile.phone} · ${profile.email}`}
          onPress={() => setEditOpen(true)}
          last
        />
      </ProfileSettingsSection>

      <ProfileSettingsSection title={t('doctor_profile.section_app')}>
        <ProfileSettingsRow
          icon={Globe}
          label={t('doctor_profile.language')}
          value={languageLabel}
          onPress={() => setLanguageOpen(true)}
        />
        <ProfileSettingsRow
          icon={Moon}
          label={t('doctor_profile.theme')}
          value={t(themeLabelKey(themeMode))}
          onPress={() => setThemeOpen(true)}
        />
        <ProfileSettingsRow
          icon={Bell}
          label={t('doctor_profile.notifications')}
          onPress={() => setNotifyOpen(true)}
          last
        />
      </ProfileSettingsSection>

      <ProfileSettingsSection title={t('doctor_profile.section_work')}>
        <ProfileSettingsRow
          icon={CalendarDays}
          label={t('doctor_profile.work_schedule')}
          onPress={() => router.push('/(doctor)/(tabs)/calendar')}
        />
        <ProfileSettingsRow
          icon={Clock}
          label={t('doctor_profile.visit_length')}
          value={t('doctor_profile.duration_value', { count: profile.appointmentDuration })}
          onPress={() => setDurationOpen(true)}
        />
        <ProfileSettingsRow
          icon={Building2}
          label={t('doctor_profile.clinic_work_profile')}
          value={profile.clinicName}
          onPress={() => setClinicOpen(true)}
          last
        />
      </ProfileSettingsSection>

      <ProfileSettingsSection title={t('doctor_profile.section_security')}>
        <ProfileSettingsRow
          icon={Shield}
          label={t('doctor_profile.privacy')}
          onPress={() => setPrivacyOpen(true)}
        />
        <ProfileSettingsRow
          icon={biometricEnabled ? ScanFace : Fingerprint}
          label={t('doctor_profile.biometric')}
          value={t('doctor_profile.biometric_hint')}
          right={
            <PremiumToggle value={biometricEnabled} onChange={setBiometricEnabled} />
          }
        />
        <ProfileSettingsRow
          icon={Smartphone}
          label={t('doctor_profile.sessions')}
          onPress={() => void openSessions()}
        />
        <ProfileSettingsRow
          icon={Lock}
          label={t('doctor_profile.logout_all')}
          onPress={() => setLogoutAllOpen(true)}
        />
        <ProfileSettingsRow
          icon={LogOut}
          label={t('doctor_profile.logout')}
          onPress={() => setLogoutOpen(true)}
          destructive
          last
        />
      </ProfileSettingsSection>

      <Text
        variant="caption"
        muted
        center
        style={{ marginTop: 4 }}
      >
        {t('doctor_profile.version', { version: '1.0.0' })}
      </Text>

      <AvatarActionSheet>
        visible={avatarOpen}
        canRemove={Boolean(profile.avatar)}
        onClose={() => setAvatarOpen(false)}
        onCamera={() => pickAvatar('camera')}
        onLibrary={() => pickAvatar('library')}
        onRemove={removeAvatar}
      />
      <AvatarPreviewSheet
        visible={Boolean(previewUri)}
        uri={previewUri}
        saving={savingAvatar}
        onClose={() => setPreviewUri(null)}
        onSave={() => void saveAvatar()}
      />
      <EditDoctorProfileSheet
        visible={editOpen}
        profile={profile}
        onClose={() => setEditOpen(false)}
        onSave={saveProfile}
      />
      <LanguageBottomSheet visible={languageOpen} onClose={() => setLanguageOpen(false)} />
      <ThemeSelector
        visible={themeOpen}
        value={themeMode}
        onClose={() => setThemeOpen(false)}
        onChange={setThemeMode}
      />
      <NotificationsSheet
        visible={notifyOpen}
        settings={profile.notificationSettings}
        onClose={() => setNotifyOpen(false)}
        onChange={setNotification}
      />
      <ChangePasswordSheet visible={passwordOpen} onClose={() => setPasswordOpen(false)} />
      <DurationSheet
        visible={durationOpen}
        value={profile.appointmentDuration}
        onClose={() => setDurationOpen(false)}
        onChange={(minutes) => patchProfile({ appointmentDuration: minutes })}
      />
      <ClinicProfileSheet
        visible={clinicOpen}
        profile={profile}
        clinic={clinic}
        onClose={() => setClinicOpen(false)}
      />
      <PrivacySheet
        visible={privacyOpen}
        clinicVisible={privacyVisibleToClinic}
        searchVisible={privacyVisibleInSearch}
        analytics={privacyAnalytics}
        onClose={() => setPrivacyOpen(false)}
        onChange={setPrivacy}
      />
      <SessionsSheet
        visible={sessionsOpen}
        sessions={sessions}
        onClose={() => setSessionsOpen(false)}
      />
      <LogoutConfirmSheet
        visible={logoutOpen}
        title={t('doctor_profile.logout_title')}
        body={t('doctor_profile.logout_body')}
        onClose={() => setLogoutOpen(false)}
        onConfirm={doLogout}
      />
      <LogoutConfirmSheet
        visible={logoutAllOpen}
        title={t('doctor_profile.logout_all_title')}
        body={t('doctor_profile.logout_all_body')}
        confirmLabel={t('doctor_profile.logout_all')}
        onClose={() => setLogoutAllOpen(false)}
        onConfirm={doLogout}
      />
    </MobileScreen>
  );
}
