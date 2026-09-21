import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { DentalBackdrop } from '@/components/auth/DentalBackdrop';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { useLoginTheme } from '@/components/auth/loginTheme';
import { MapPin, UserRound } from '@/components/icons';
import { Text } from '@/components/ui/Text';
import { APP_VARIANT } from '@/constants/appVariant';
import { updatePatientProfile } from '@/services/authService';
import { useSettingsStore } from '@/store/settingsStore';

type Gender = 'MALE' | 'FEMALE';

export function PatientOnboardingScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, isDark, canvas, canvasMid, authSurface, field, hairline } =
    useLoginTheme();

  const isAuthenticated = useSettingsStore((s) => s.isAuthenticated);
  const patientOnboardingDone = useSettingsStore((s) => s.patientOnboardingDone);
  const setPatientOnboardingDone = useSettingsStore((s) => s.setPatientOnboardingDone);

  const [gender, setGender] = useState<Gender | null>(null);
  const [birthDate, setBirthDate] = useState('');
  const [locationStatus, setLocationStatus] = useState<'idle' | 'granted' | 'denied'>(
    'idle',
  );
  const [loading, setLoading] = useState(false);

  if (!isAuthenticated) return <Redirect href="/login" />;
  if (APP_VARIANT !== 'client') return <Redirect href="/" />;
  if (patientOnboardingDone) return <Redirect href="/" />;

  const finish = async (skip: boolean) => {
    setLoading(true);
    try {
      if (!skip && (gender || /^\d{4}-\d{2}-\d{2}$/.test(birthDate))) {
        await updatePatientProfile({
          ...(gender ? { gender } : {}),
          ...(/^\d{4}-\d{2}-\d{2}$/.test(birthDate) ? { birthDate } : {}),
        }).catch(() => undefined);
      }
      setPatientOnboardingDone(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/');
    } finally {
      setLoading(false);
    }
  };

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationStatus(status === 'granted' ? 'granted' : 'denied');
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      setLocationStatus('denied');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: canvas }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <LinearGradient
        colors={[canvas, canvasMid, authSurface]}
        locations={[0, 0.4, 1]}
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
      />
      <DentalBackdrop />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 32,
          paddingHorizontal: 24,
          paddingBottom: Math.max(insets.bottom, 16) + 24,
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            backgroundColor: authSurface,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: hairline,
            padding: 24,
            gap: 20,
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              backgroundColor: field,
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'center',
            }}
          >
            <UserRound size={24} color={colors.primary} strokeWidth={1.8} />
          </View>

          <View style={{ gap: 8 }}>
            <Text
              style={{
                fontFamily: 'Geologica_700Bold',
                fontSize: 24,
                lineHeight: 30,
                color: colors.text,
                textAlign: 'center',
              }}
            >
              {t('auth.onboarding.title')}
            </Text>
            <Text
              style={{
                fontFamily: 'GolosText_400Regular',
                fontSize: 15,
                lineHeight: 22,
                color: colors.textSecondary,
                textAlign: 'center',
              }}
            >
              {t('auth.onboarding.subtitle')}
            </Text>
          </View>

          <View style={{ gap: 10 }}>
            <Text
              style={{
                fontFamily: 'GolosText_500Medium',
                fontSize: 13,
                color: colors.textSecondary,
              }}
            >
              {t('auth.onboarding.gender')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {(['MALE', 'FEMALE'] as const).map((g) => {
                const active = gender === g;
                return (
                  <Pressable
                    key={g}
                    onPress={() => setGender(g)}
                    style={{
                      flex: 1,
                      height: 48,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: active ? colors.primary : hairline,
                      backgroundColor: active ? `${colors.primary}14` : field,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'GolosText_600SemiBold',
                        fontSize: 14,
                        color: active ? colors.primary : colors.text,
                      }}
                    >
                      {t(
                        g === 'MALE'
                          ? 'auth.onboarding.gender_male'
                          : 'auth.onboarding.gender_female',
                      )}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={{ gap: 10 }}>
            <Text
              style={{
                fontFamily: 'GolosText_500Medium',
                fontSize: 13,
                color: colors.textSecondary,
              }}
            >
              {t('auth.onboarding.birthday')}
            </Text>
            <TextInput
              value={birthDate}
              onChangeText={setBirthDate}
              placeholder={t('auth.onboarding.birthday_hint')}
              placeholderTextColor={colors.textMuted}
              keyboardType="numbers-and-punctuation"
              style={{
                height: 52,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: hairline,
                backgroundColor: field,
                paddingHorizontal: 16,
                fontFamily: 'GolosText_500Medium',
                fontSize: 15,
                color: colors.text,
              }}
            />
          </View>

          <Pressable
            onPress={() => void requestLocation()}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 14,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: locationStatus === 'granted' ? colors.primary : hairline,
              backgroundColor: field,
            }}
          >
            <MapPin
              size={18}
              color={locationStatus === 'granted' ? colors.primary : colors.textMuted}
              strokeWidth={1.8}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: 'GolosText_600SemiBold',
                  fontSize: 14,
                  color: colors.text,
                }}
              >
                {t('auth.onboarding.location')}
              </Text>
              <Text
                style={{
                  fontFamily: 'GolosText_400Regular',
                  fontSize: 12,
                  color: colors.textMuted,
                }}
              >
                {locationStatus === 'granted'
                  ? t('auth.onboarding.location_granted')
                  : locationStatus === 'denied'
                    ? t('auth.onboarding.location_denied')
                    : t('auth.onboarding.location_hint')}
              </Text>
            </View>
          </Pressable>

          <PrimaryButton
            title={t('auth.onboarding.continue')}
            onPress={() => void finish(false)}
            loading={loading}
            disabled={loading}
          />

          <Pressable
            onPress={() => void finish(true)}
            disabled={loading}
            style={{ alignSelf: 'center', paddingVertical: 4 }}
          >
            <Text
              style={{
                fontFamily: 'GolosText_500Medium',
                fontSize: 14,
                color: colors.textSecondary,
              }}
            >
              {t('auth.onboarding.later')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
