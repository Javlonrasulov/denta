import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import type { CreatePatientInput, Gender } from '@/types';

export function AddPatientSheet({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (input: CreatePatientInput) => Promise<void> | void;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, authSurface, field, hairline, isDark } = useLoginTheme();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('+998');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setFirstName('');
    setLastName('');
    setPhone('+998');
    setBirthDate('');
    setGender('male');
    setNotes('');
    setError(null);
    setSaving(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError(t('patients.required'));
      return;
    }
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 9) {
      setError(t('patients.phone_invalid'));
      return;
    }
    setSaving(true);
    try {
      await onSave({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        birthDate: birthDate.trim() || '1990-01-01',
        gender,
        notes: notes.trim() || undefined,
      });
      reset();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close} statusBarTranslucent>
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: 'flex-end' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} onPress={close}>
          <Animated.View
            entering={FadeIn.duration(180)}
            exiting={FadeOut.duration(160)}
            style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.46)' }}
          />
        </Pressable>
        <Animated.View
          entering={SlideInDown.springify().damping(20).stiffness(220)}
          exiting={SlideOutDown.springify().damping(22).stiffness(240)}
          style={{
            backgroundColor: authSurface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 20,
            paddingTop: 10,
            paddingBottom: Math.max(insets.bottom, 16) + 12,
            maxHeight: '88%',
          }}
        >
          <View style={{ alignItems: 'center', paddingBottom: 8 }}>
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: colors.textMuted,
                opacity: 0.35,
              }}
            />
          </View>
          <Text
            style={{
              fontFamily: 'Geologica_600SemiBold',
              fontSize: 18,
              lineHeight: 24,
              color: colors.text,
              marginBottom: 14,
            }}
          >
            {t('patients.add_patient')}
          </Text>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingBottom: 8 }}
          >
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Input
                  label={t('patients.add_first_name')}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label={t('patients.add_last_name')}
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                />
              </View>
            </View>
            <Input
              label={t('patients.add_phone')}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <Input
              label={t('patients.add_birth')}
              value={birthDate}
              onChangeText={setBirthDate}
              placeholder="1995-03-14"
              keyboardType="numbers-and-punctuation"
            />
            <View style={{ gap: 6 }}>
              <Text variant="label" color={colors.textSecondary}>
                {t('patients.add_gender')}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(['male', 'female'] as Gender[]).map((g) => {
                  const selected = gender === g;
                  return (
                    <Pressable
                      key={g}
                      onPress={() => {
                        void Haptics.selectionAsync();
                        setGender(g);
                      }}
                      style={{
                        flex: 1,
                        height: 40,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: selected
                          ? isDark
                            ? 'rgba(129,140,248,0.18)'
                            : 'rgba(67,56,202,0.1)'
                          : field,
                        borderWidth: 1,
                        borderColor: selected ? colors.primary : hairline,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'GolosText_600SemiBold',
                          fontSize: 13,
                          color: selected ? colors.primary : colors.textSecondary,
                        }}
                      >
                        {t(`patients.gender_${g}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <Input
              label={t('patients.add_notes')}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
            {error ? (
              <Text variant="caption" color={colors.error}>
                {error}
              </Text>
            ) : null}
            <ScalePressable
              accessibilityLabel={t('patients.save_patient')}
              disabled={saving}
              onPress={() => void submit()}
              style={{
                height: 48,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.primary,
                opacity: saving ? 0.6 : 1,
                marginTop: 4,
              }}
            >
              <Text
                style={{
                  fontFamily: 'GolosText_600SemiBold',
                  fontSize: 15,
                  color: '#FFFFFF',
                }}
              >
                {t('patients.save_patient')}
              </Text>
            </ScalePressable>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
