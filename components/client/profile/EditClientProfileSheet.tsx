import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { useLoginTheme } from '@/components/auth/loginTheme';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { ProfileSheet } from '@/components/doctor/profile/ProfileSheet';
import { Camera, ImageIcon, Mail, Phone, Trash2, type LucideIcon } from '@/components/icons';
import { Avatar } from '@/components/ui/Avatar';
import { Text } from '@/components/ui/Text';
import {
  authErrorMessage,
  updatePatientProfile,
  uploadPatientAvatar,
} from '@/services/authService';
import { pickDoctorAvatar, type AvatarPickSource } from '@/services/doctorProfileService';
import { useToastStore } from '@/store/toastStore';
import { useUserStore, type PatientGender } from '@/store/userStore';
import { ProfileChoiceGroup, ProfileFormField } from './ProfileFormField';

function isoToDisplay(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : '';
}

function maskBirthDate(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
}

/** Returns ISO date, '' for empty input, or null when invalid. */
function displayToIso(display: string): string | null {
  if (!display.trim()) return '';
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(display);
  if (!m) return null;
  const [day, month, year] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    year < 1900 ||
    date.getTime() > Date.now()
  ) {
    return null;
  }
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function AvatarAction({
  icon: Icon,
  label,
  onPress,
  danger,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  const { colors, field, hairline, isDark } = useLoginTheme();
  const tone = danger ? colors.error : colors.primary;
  return (
    <ScalePressable
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      style={{
        flex: 1,
        height: 38,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: danger
          ? isDark
            ? 'rgba(251,113,133,0.3)'
            : 'rgba(239,68,68,0.22)'
          : hairline,
        backgroundColor: field,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        <Icon size={14} color={tone} strokeWidth={2} />
        <Text
          numberOfLines={1}
          maxFontSizeMultiplier={1}
          style={{ fontFamily: 'GolosText_600SemiBold', fontSize: 12, color: tone }}
        >
          {label}
        </Text>
      </View>
    </ScalePressable>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
  actionLabel,
  onPress,
  last,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  actionLabel: string;
  onPress: () => void;
  last?: boolean;
}) {
  const { colors, hairline } = useLoginTheme();
  return (
    <ScalePressable accessibilityLabel={`${label}: ${actionLabel}`} onPress={onPress}>
      <View
        style={{
          minHeight: 58,
          paddingHorizontal: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          borderBottomWidth: last ? 0 : 1,
          borderBottomColor: hairline,
        }}
      >
        <Icon size={16} color={colors.primary} strokeWidth={1.9} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            maxFontSizeMultiplier={1.1}
            style={{ fontFamily: 'GolosText_400Regular', fontSize: 12, color: colors.textMuted }}
          >
            {label}
          </Text>
          <Text
            numberOfLines={1}
            maxFontSizeMultiplier={1.1}
            style={{ fontFamily: 'GolosText_600SemiBold', fontSize: 14, color: colors.text }}
          >
            {value}
          </Text>
        </View>
        <Text
          maxFontSizeMultiplier={1}
          style={{ fontFamily: 'GolosText_600SemiBold', fontSize: 13, color: colors.primary }}
        >
          {actionLabel}
        </Text>
      </View>
    </ScalePressable>
  );
}

export function EditClientProfileSheet({
  visible,
  onClose,
  onChangePhone,
  onChangeEmail,
}: {
  visible: boolean;
  onClose: () => void;
  onChangePhone: () => void;
  onChangeEmail: () => void;
}) {
  const { t } = useTranslation();
  const { colors, hairline, isDark } = useLoginTheme();
  const showToast = useToastStore((s) => s.showToast);
  const user = useUserStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<PatientGender | null>(null);
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const state = useUserStore.getState();
    const [fallbackFirst = '', ...rest] = state.fullName.trim().split(/\s+/);
    setFirstName(state.firstName || fallbackFirst);
    setLastName(state.lastName || rest.join(' '));
    setGender(state.gender);
    setBirthDate(isoToDisplay(state.birthDate));
    setError(null);
  }, [visible]);

  const displayName =
    `${firstName} ${lastName}`.trim() || user.fullName.trim() || t('profile.guest_name');

  const changeAvatar = async (source: AvatarPickSource) => {
    const picked = await pickDoctorAvatar(source);
    if (!picked.ok) {
      if (picked.reason === 'permission') {
        showToast({ tone: 'warning', title: t('profile.avatar_title'), message: t('profile.permission_denied') });
      } else if (picked.reason === 'error') {
        showToast({ tone: 'error', title: t('profile.avatar_title'), message: t('profile.avatar_error') });
      }
      return;
    }
    setAvatarBusy(true);
    try {
      await uploadPatientAvatar(picked.uri);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast({ tone: 'success', title: t('profile.saved'), message: t('profile.avatar_updated') });
    } catch {
      showToast({ tone: 'error', title: t('profile.avatar_title'), message: t('profile.avatar_error') });
    } finally {
      setAvatarBusy(false);
    }
  };

  const removeAvatar = async () => {
    setAvatarBusy(true);
    try {
      await updatePatientProfile({ avatarUrl: '' });
      showToast({ tone: 'success', title: t('profile.saved'), message: t('profile.avatar_removed') });
    } catch (err) {
      showToast({ tone: 'error', title: t('profile.avatar_title'), message: authErrorMessage(err, t) });
    } finally {
      setAvatarBusy(false);
    }
  };

  const submit = async () => {
    const first = firstName.trim();
    const last = lastName.trim();
    if (!first) {
      setError(t('profile.first_name_required'));
      return;
    }
    const iso = displayToIso(birthDate);
    if (iso === null) {
      setError(t('profile.birth_date_invalid'));
      return;
    }
    const state = useUserStore.getState();
    const patch: Parameters<typeof updatePatientProfile>[0] = {};
    if (first !== state.firstName) patch.firstName = first;
    if (last !== state.lastName) patch.lastName = last;
    if (gender && gender !== state.gender) patch.gender = gender;
    if (iso && iso !== state.birthDate) patch.birthDate = iso;

    setError(null);
    if (Object.keys(patch).length === 0) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      await updatePatientProfile(patch);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast({ tone: 'success', title: t('profile.saved'), message: t('profile.profile_saved') });
      onClose();
    } catch (err) {
      setError(authErrorMessage(err, t));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProfileSheet
      visible={visible}
      onClose={saving ? () => undefined : onClose}
      title={t('profile.edit_title')}
      subtitle={t('profile.edit_subtitle')}
      maxHeight="92%"
      footer={
        <PrimaryButton
          title={t('common.save')}
          onPress={() => void submit()}
          loading={saving}
          disabled={saving || avatarBusy}
        />
      }
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          padding: 14,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: hairline,
          backgroundColor: isDark ? '#151D2E' : '#F4F6FB',
        }}
      >
        <View>
          <Avatar uri={user.avatarUrl || undefined} name={displayName} size={64} />
          {avatarBusy ? (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: 'rgba(15,23,42,0.45)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ActivityIndicator color="#FFFFFF" />
            </View>
          ) : null}
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 8 }}>
          <Text
            maxFontSizeMultiplier={1.1}
            style={{ fontFamily: 'GolosText_600SemiBold', fontSize: 14, color: colors.text }}
          >
            {t('profile.avatar_title')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <AvatarAction
              icon={Camera}
              label={t('profile.avatar_camera')}
              onPress={() => void changeAvatar('camera')}
              disabled={avatarBusy}
            />
            <AvatarAction
              icon={ImageIcon}
              label={t('profile.avatar_gallery')}
              onPress={() => void changeAvatar('library')}
              disabled={avatarBusy}
            />
            {user.avatarUrl ? (
              <AvatarAction
                icon={Trash2}
                label={t('profile.avatar_remove')}
                onPress={() => void removeAvatar()}
                disabled={avatarBusy}
                danger
              />
            ) : null}
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <ProfileFormField
            label={t('profile.first_name')}
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            autoComplete="given-name"
            maxLength={80}
          />
        </View>
        <View style={{ flex: 1 }}>
          <ProfileFormField
            label={t('profile.last_name')}
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
            autoComplete="family-name"
            maxLength={80}
          />
        </View>
      </View>

      <ProfileChoiceGroup<PatientGender>
        label={t('profile.gender')}
        value={gender}
        onChange={setGender}
        options={[
          { value: 'MALE', label: t('profile.gender_male') },
          { value: 'FEMALE', label: t('profile.gender_female') },
        ]}
      />

      <ProfileFormField
        label={t('profile.birth_date')}
        value={birthDate}
        onChangeText={(text) => setBirthDate(maskBirthDate(text))}
        placeholder={t('profile.birth_date_placeholder')}
        keyboardType="number-pad"
        maxLength={10}
      />

      <View style={{ gap: 6 }}>
        <Text variant="label" color={colors.textSecondary}>
          {t('profile.contacts')}
        </Text>
        <View
          style={{
            borderRadius: 16,
            borderWidth: 1,
            borderColor: hairline,
            backgroundColor: isDark ? '#151D2E' : '#F4F6FB',
            overflow: 'hidden',
          }}
        >
          <ContactRow
            icon={Phone}
            label={t('profile.phone')}
            value={user.phone.trim() || t('profile.phone_missing')}
            actionLabel={t('profile.change')}
            onPress={onChangePhone}
          />
          <ContactRow
            icon={Mail}
            label={t('profile.email_label')}
            value={user.email.trim() || t('profile.email_missing')}
            actionLabel={t('profile.change')}
            onPress={onChangeEmail}
            last
          />
        </View>
      </View>

      {error ? (
        <Text variant="caption" color={colors.error}>
          {error}
        </Text>
      ) : null}
    </ProfileSheet>
  );
}
