import { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { DentalBackdrop } from '@/components/auth/DentalBackdrop';
import { LanguageBottomSheet } from '@/components/auth/LanguageBottomSheet';
import { OtpInput } from '@/components/auth/OtpInput';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { ThemeToggle } from '@/components/auth/ThemeToggle';
import { useLoginTheme } from '@/components/auth/loginTheme';
import { ArrowLeft, Globe, Mail } from '@/components/icons';
import { Text } from '@/components/ui/Text';
import { LOCALE_OPTIONS } from '@/components/ui/LanguageMenu';
import { APP_VARIANT } from '@/constants/appVariant';
import {
  authErrorMessage,
  resendPatientVerification,
  verifyPatientEmail,
} from '@/services/authService';
import { useSettingsStore } from '@/store/settingsStore';

function formatCountdown(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function PatientVerifyEmailScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ email?: string; cooldown?: string }>();
  const email = (params.email ?? '').trim().toLowerCase();
  const initialCooldown = Math.max(0, Number(params.cooldown ?? 60) || 60);

  const {
    colors,
    isDark,
    canvas,
    canvasMid,
    authSurface,
    field,
    hairline,
  } = useLoginTheme();

  const isAuthenticated = useSettingsStore((s) => s.isAuthenticated);
  const locale = useSettingsStore((s) => s.locale);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const currentLocale = LOCALE_OPTIONS.find((item) => item.code === locale) ?? LOCALE_OPTIONS[0];
  const fromProfileRef = useRef(isAuthenticated);

  const [code, setCode] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(
    fromProfileRef.current ? 0 : initialCooldown,
  );
  const [langOpen, setLangOpen] = useState(false);
  const submitting = useRef(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => {
      setCooldown((v) => Math.max(0, v - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  useEffect(() => {
    if (!fromProfileRef.current || !email) return;
    void (async () => {
      try {
        const result = await resendPatientVerification(email);
        setCooldown(result.resendAvailableIn ?? 60);
      } catch {
        /* user can tap resend */
      }
    })();
  }, [email]);

  const onVerify = useCallback(() => {
    if (submitting.current || loading) return;
    if (code.length !== 6) {
      setFormError(t('auth.errors.invalid_otp'));
      return;
    }
    submitting.current = true;
    setLoading(true);
    setFormError('');
    void (async () => {
      try {
        await verifyPatientEmail(email, code);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace(
          fromProfileRef.current ? '/(client)/(tabs)/profile' : '/onboarding',
        );
      } catch (err) {
        setFormError(authErrorMessage(err, t));
        setCode('');
      } finally {
        setLoading(false);
        submitting.current = false;
      }
    })();
  }, [code, email, loading, t]);

  useEffect(() => {
    if (code.length === 6 && !loading && !submitting.current) {
      onVerify();
    }
  }, [code, loading, onVerify]);

  if (APP_VARIANT !== 'client' || !email) {
    return <Redirect href="/login" />;
  }

  const onResend = () => {
    if (cooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setFormError('');
    void (async () => {
      try {
        const result = await resendPatientVerification(email);
        setCooldown(result.resendAvailableIn ?? 60);
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (err) {
        setFormError(authErrorMessage(err, t));
      } finally {
        setResendLoading(false);
      }
    })();
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

      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 4,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          onPress={() => router.back()}
          hitSlop={12}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: field,
            borderWidth: 1,
            borderColor: hairline,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ArrowLeft size={18} color={colors.text} strokeWidth={1.8} />
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setLangOpen(true)}
            style={{
              height: 36,
              paddingHorizontal: 12,
              borderRadius: 18,
              backgroundColor: field,
              borderWidth: 1,
              borderColor: hairline,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Globe size={14} color={colors.textSecondary} strokeWidth={1.8} />
            <Text
              style={{
                fontFamily: 'Geologica_600SemiBold',
                fontSize: 12,
                color: colors.text,
              }}
            >
              {currentLocale.short}
            </Text>
          </Pressable>
          <ThemeToggle
            isDark={isDark}
            accessibilityLabel={t('profile.dark_mode')}
            onToggle={() => setThemeMode(isDark ? 'light' : 'dark')}
          />
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingTop: 24,
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
              <Mail size={24} color={colors.primary} strokeWidth={1.8} />
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
                {t('auth.verify.title')}
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
                {t('auth.verify.subtitle', { email })}
              </Text>
            </View>

            <OtpInput
              value={code}
              onChange={(next) => {
                setCode(next);
                if (formError) setFormError('');
              }}
              disabled={loading}
              error={Boolean(formError)}
              autoFocus
            />

            {formError ? (
              <Text
                style={{
                  fontFamily: 'GolosText_400Regular',
                  fontSize: 13,
                  color: colors.error,
                  textAlign: 'center',
                }}
              >
                {formError}
              </Text>
            ) : null}

            <PrimaryButton
              title={t('auth.verify.submit')}
              onPress={onVerify}
              loading={loading}
              disabled={loading || code.length !== 6}
            />

            <View style={{ alignItems: 'center', gap: 12 }}>
              {cooldown > 0 ? (
                <Text
                  style={{
                    fontFamily: 'GolosText_500Medium',
                    fontSize: 14,
                    color: colors.textMuted,
                  }}
                >
                  {t('auth.verify.resend_in', { time: formatCountdown(cooldown) })}
                </Text>
              ) : (
                <Pressable
                  onPress={onResend}
                  disabled={resendLoading}
                  hitSlop={8}
                >
                  <Text
                    style={{
                      fontFamily: 'GolosText_600SemiBold',
                      fontSize: 14,
                      color: colors.primary,
                      opacity: resendLoading ? 0.5 : 1,
                    }}
                  >
                    {t('auth.verify.resend')}
                  </Text>
                </Pressable>
              )}

              <Pressable
                onPress={() =>
                  router.replace(
                    fromProfileRef.current ? '/(client)/(tabs)/profile' : '/register',
                  )
                }
                hitSlop={8}
              >
                <Text
                  style={{
                    fontFamily: 'GolosText_400Regular',
                    fontSize: 14,
                    color: colors.textSecondary,
                  }}
                >
                  {fromProfileRef.current
                    ? t('common.back')
                    : t('auth.verify.change_email')}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <LanguageBottomSheet visible={langOpen} onClose={() => setLangOpen(false)} />
    </View>
  );
}
