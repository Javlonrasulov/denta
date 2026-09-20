import { useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { useLoginTheme } from '@/components/auth/loginTheme';
import { LOCALE_OPTIONS } from '@/components/ui/LanguageMenu';
import { Text } from '@/components/ui/Text';
import type { DoctorProfile, LocaleCode, UpdateDoctorProfileInput } from '@/types';
import { ProfileSheet } from './ProfileSheet';

function Field({
  label,
  value,
  onChangeText,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
  keyboardType?: 'default' | 'phone-pad' | 'email-address' | 'number-pad';
}) {
  const { colors, field, hairline } = useLoginTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text variant="label" color={colors.textSecondary}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType}
        textAlignVertical={multiline ? 'top' : 'center'}
        placeholderTextColor={colors.textMuted}
        style={{
          minHeight: multiline ? 92 : 48,
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: multiline ? 12 : 0,
          backgroundColor: field,
          borderWidth: 1,
          borderColor: hairline,
          color: colors.text,
          fontFamily: 'GolosText_400Regular',
          fontSize: 15,
        }}
      />
    </View>
  );
}

export function EditDoctorProfileSheet({
  visible,
  profile,
  onClose,
  onSave,
}: {
  visible: boolean;
  profile: DoctorProfile | null;
  onClose: () => void;
  onSave: (patch: UpdateDoctorProfileInput) => void;
}) {
  const { t } = useTranslation();
  const { colors, field, hairline, isDark } = useLoginTheme();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [experience, setExperience] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [languages, setLanguages] = useState<LocaleCode[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !profile) return;
    setFirstName(profile.firstName);
    setLastName(profile.lastName);
    setSpecialty(profile.specialty);
    setExperience(String(profile.experienceYears));
    setPhone(profile.phone);
    setEmail(profile.email);
    setBio(profile.bio);
    setLanguages(profile.languages);
    setError(null);
  }, [visible, profile]);

  const toggleLang = (code: LocaleCode) => {
    void Haptics.selectionAsync();
    setLanguages((prev) =>
      prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code],
    );
  };

  const submit = () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError(t('doctor_profile.required'));
      return;
    }
    if (phone.replace(/\D/g, '').length < 9) {
      setError(t('doctor_profile.phone_invalid'));
      return;
    }
    if (!email.includes('@')) {
      setError(t('doctor_profile.email_invalid'));
      return;
    }
    onSave({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      specialty: specialty.trim(),
      experienceYears: Number.parseInt(experience, 10) || profile?.experienceYears,
      phone: phone.trim(),
      email: email.trim(),
      bio: bio.trim(),
      languages,
    });
    onClose();
  };

  return (
    <ProfileSheet visible={visible} onClose={onClose} title={t('doctor_profile.edit_title')}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Field label={t('doctor_profile.first_name')} value={firstName} onChangeText={setFirstName} />
        </View>
        <View style={{ flex: 1 }}>
          <Field label={t('doctor_profile.last_name')} value={lastName} onChangeText={setLastName} />
        </View>
      </View>
      <Field label={t('doctor_profile.specialty')} value={specialty} onChangeText={setSpecialty} />
      <Field
        label={t('doctor_profile.experience')}
        value={experience}
        onChangeText={setExperience}
        keyboardType="number-pad"
      />
      <Field
        label={t('doctor_profile.phone')}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <Field
        label={t('doctor_profile.email')}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <Field label={t('doctor_profile.bio')} value={bio} onChangeText={setBio} multiline />
      <View style={{ gap: 8 }}>
        <Text variant="label" color={colors.textSecondary}>
          {t('doctor_profile.languages')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {LOCALE_OPTIONS.map((item) => {
            const active = languages.includes(item.code);
            return (
              <Pressable
                key={item.code}
                onPress={() => toggleLang(item.code)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 12,
                  backgroundColor: active
                    ? isDark
                      ? 'rgba(129,140,248,0.18)'
                      : 'rgba(67,56,202,0.1)'
                    : field,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : hairline,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'GolosText_600SemiBold',
                    fontSize: 13,
                    color: active ? colors.primary : colors.textSecondary,
                  }}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      {error ? (
        <Text variant="caption" color={colors.error}>
          {error}
        </Text>
      ) : null}
      <PrimaryButton title={t('doctor_profile.save')} onPress={submit} />
    </ProfileSheet>
  );
}
