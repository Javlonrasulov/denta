import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { Redirect, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AuthField } from '@/components/auth/AuthField';
import { DentalBackdrop } from '@/components/auth/DentalBackdrop';
import { LanguageBottomSheet } from '@/components/auth/LanguageBottomSheet';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { ThemeToggle } from '@/components/auth/ThemeToggle';
import { useLoginTheme } from '@/components/auth/loginTheme';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Mail,
  Phone,
  UserRound,
  XCircle,
} from '@/components/icons';
import { Text } from '@/components/ui/Text';
import { LOCALE_OPTIONS } from '@/components/ui/LanguageMenu';
import { BrandLockup } from '@/components/brand/BrandLockup';
import { APP_VARIANT } from '@/constants/appVariant';
import { useEmailAvailability } from '@/hooks/useEmailAvailability';
import { authErrorMessage, registerPatient } from '@/services/authService';
import { useSettingsStore } from '@/store/settingsStore';
import {
  isValidPatientPassword,
  isValidUzPhone,
  maskUzLocalInput,
  normalizeUzPhone,
} from '@/utils/phone';

const TERMS_URL = 'https://denta.uz/terms';
const PRIVACY_URL = 'https://denta.uz/privacy';

export function PatientRegisterScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
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

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const submitting = useRef(false);

  const emailCheck = useEmailAvailability(email);

  if (isAuthenticated) {
    return <Redirect href="/" />;
  }

  if (APP_VARIANT !== 'client') {
    return <Redirect href="/login" />;
  }

  const clearErrors = () => {
    if (formError) setFormError('');
  };

  const setFieldError = (key: string, message: string | undefined) => {
    setFieldErrors((prev) => {
      if (!message) {
        if (!(key in prev)) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      }
      if (prev[key] === message) return prev;
      return { ...prev, [key]: message };
    });
  };

  const checkPasswordMatch = (pass: string, confirm: string) => {
    if (!confirm) {
      setFieldError('confirmPassword', undefined);
      return;
    }
    if (pass !== confirm) {
      setFieldError('confirmPassword', t('auth.register.password_mismatch'));
    } else {
      setFieldError('confirmPassword', undefined);
    }
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!firstName.trim()) next.firstName = t('auth.register.first_name_required');
    if (!lastName.trim()) next.lastName = t('auth.register.last_name_required');
    if (!email.trim()) {
      next.email = t('auth.invalid_email');
    } else if (emailCheck.state === 'invalid' && emailCheck.reason === 'INVALID_EMAIL') {
      next.email = t('auth.email_check.invalid_format');
    } else if (emailCheck.state === 'invalid' && emailCheck.reason === 'INVALID_DOMAIN') {
      next.email = t('auth.email_check.invalid_domain');
    } else if (emailCheck.state === 'taken') {
      next.email = t('auth.email_check.taken');
    } else if (emailCheck.state !== 'valid') {
      next.email = t('auth.email_check.wait');
    }
    if (!isValidUzPhone(phone)) next.phone = t('auth.errors.invalid_phone');
    if (!isValidPatientPassword(password)) next.password = t('auth.errors.weak_password');
    if (!confirmPassword) {
      next.confirmPassword = t('auth.register.confirm_password_required');
    } else if (password !== confirmPassword) {
      next.confirmPassword = t('auth.register.password_mismatch');
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const canSubmit =
    Boolean(firstName.trim()) &&
    Boolean(lastName.trim()) &&
    emailCheck.isValid &&
    isValidUzPhone(phone) &&
    isValidPatientPassword(password) &&
    password === confirmPassword &&
    !loading &&
    emailCheck.state !== 'checking';

  const passwordHelper =
    password.length > 0 && !isValidPatientPassword(password)
      ? t('auth.errors.weak_password')
      : null;

  const submitBlockedReason = (() => {
    if (loading || emailCheck.state === 'checking') return null;
    if (canSubmit) return null;
    if (!firstName.trim() || !lastName.trim()) return t('auth.register.fill_required');
    if (!emailCheck.isValid) return t('auth.email_check.wait');
    if (!isValidUzPhone(phone)) return t('auth.errors.invalid_phone');
    if (!isValidPatientPassword(password)) return t('auth.errors.weak_password');
    if (password !== confirmPassword) return t('auth.register.password_mismatch');
    return t('auth.register.fill_required');
  })();

  const emailStatusIcon = (() => {
    switch (emailCheck.state) {
      case 'checking':
        return <ActivityIndicator size="small" color={colors.primary} />;
      case 'valid':
        return <CheckCircle2 size={20} color={colors.success} strokeWidth={2} />;
      case 'taken':
        return <XCircle size={20} color={colors.error} strokeWidth={2} />;
      case 'invalid':
        return <AlertCircle size={20} color={colors.error} strokeWidth={2} />;
      case 'error':
        return <AlertTriangle size={20} color={colors.textMuted} strokeWidth={2} />;
      default:
        return null;
    }
  })();

  const emailHelper = (() => {
    if (fieldErrors.email) return null;
    switch (emailCheck.state) {
      case 'valid':
        return {
          text: t('auth.email_check.valid'),
          tone: 'success' as const,
        };
      case 'invalid':
        return {
          text:
            emailCheck.reason === 'INVALID_DOMAIN'
              ? t('auth.email_check.invalid_domain')
              : t('auth.email_check.invalid_format'),
          tone: 'error' as const,
        };
      case 'taken':
        return {
          text: t('auth.email_check.taken'),
          tone: 'error' as const,
        };
      case 'error':
        return {
          text: t('auth.email_check.network'),
          tone: 'error' as const,
        };
      default:
        return null;
    }
  })();

  const emailStatusTone =
    emailCheck.state === 'valid'
      ? ('success' as const)
      : emailCheck.state === 'invalid' ||
          emailCheck.state === 'taken' ||
          emailCheck.state === 'error'
        ? ('error' as const)
        : ('default' as const);

  const onSubmit = () => {
    if (submitting.current || loading) return;
    if (!validate()) return;
    const normalizedPhone = normalizeUzPhone(phone);
    if (!normalizedPhone) return;

    submitting.current = true;
    setLoading(true);
    setFormError('');
    void (async () => {
      try {
        await registerPatient({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          phone: normalizedPhone,
          password,
        });
        router.replace('/onboarding');
      } catch (err) {
        setFormError(authErrorMessage(err, t));
      } finally {
        setLoading(false);
        submitting.current = false;
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
            accessibilityLabel={t('profile.language')}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setLangOpen(true);
            }}
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 12,
            paddingBottom: Math.max(insets.bottom, 16) + 32,
            gap: 20,
          }}
        >
          <View style={{ alignItems: 'center', gap: 10, paddingVertical: 8 }}>
            <BrandLockup variant="client" size="sm" />
            <Text
              style={{
                fontFamily: 'Geologica_700Bold',
                fontSize: 26,
                lineHeight: 32,
                color: colors.text,
                textAlign: 'center',
              }}
            >
              {t('auth.register.title')}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: authSurface,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: hairline,
              padding: 20,
              gap: 14,
            }}
          >
            <AuthField
              label={t('auth.register.first_name')}
              value={firstName}
              onChangeText={(v) => {
                setFirstName(v);
                clearErrors();
                setFieldError('firstName', undefined);
              }}
              autoCapitalize="words"
              textContentType="givenName"
              returnKeyType="next"
              error={fieldErrors.firstName}
              leftIcon={<UserRound size={18} color={colors.textMuted} strokeWidth={1.8} />}
            />
            <AuthField
              label={t('auth.register.last_name')}
              value={lastName}
              onChangeText={(v) => {
                setLastName(v);
                clearErrors();
                setFieldError('lastName', undefined);
              }}
              autoCapitalize="words"
              textContentType="familyName"
              returnKeyType="next"
              error={fieldErrors.lastName}
              leftIcon={<UserRound size={18} color={colors.textMuted} strokeWidth={1.8} />}
            />

            <AuthField
              label={t('auth.email')}
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                clearErrors();
                setFieldError('email', undefined);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
              placeholder="name@email.com"
              error={fieldErrors.email}
              helperText={emailHelper?.text}
              helperTone={emailHelper?.tone}
              statusTone={emailStatusTone}
              leftIcon={<Mail size={18} color={colors.textMuted} strokeWidth={1.8} />}
              rightIcon={emailStatusIcon}
            />
            {emailCheck.state === 'taken' ? (
              <Pressable
                onPress={() => router.replace('/login')}
                style={{ alignSelf: 'flex-start', marginTop: -6 }}
              >
                <Text
                  style={{
                    fontFamily: 'GolosText_600SemiBold',
                    fontSize: 13,
                    color: colors.primary,
                  }}
                >
                  {t('auth.email_check.go_login')}
                </Text>
              </Pressable>
            ) : null}

            <AuthField
              label={t('auth.register.phone')}
              value={phone}
              onChangeText={(v) => {
                setPhone(maskUzLocalInput(v));
                clearErrors();
                setFieldError('phone', undefined);
              }}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              returnKeyType="next"
              placeholder="93 559 96 99"
              error={fieldErrors.phone}
              leftIcon={
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Phone size={18} color={colors.textMuted} strokeWidth={1.8} />
                  <Text
                    style={{
                      fontFamily: 'GolosText_600SemiBold',
                      fontSize: 16,
                      color: colors.text,
                      includeFontPadding: false,
                    }}
                  >
                    +998
                  </Text>
                </View>
              }
            />

            <AuthField
              label={t('auth.password')}
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                clearErrors();
                setFieldError('password', undefined);
                checkPasswordMatch(v, confirmPassword);
              }}
              secureTextEntry={!showPassword}
              textContentType="newPassword"
              returnKeyType="next"
              placeholder="••••••••"
              error={fieldErrors.password || passwordHelper || undefined}
              statusTone={
                fieldErrors.password || passwordHelper
                  ? 'error'
                  : password.length >= 6 && isValidPatientPassword(password)
                    ? 'success'
                    : 'default'
              }
              leftIcon={<Lock size={18} color={colors.textMuted} strokeWidth={1.8} />}
              rightIcon={
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel={
                    showPassword ? t('auth.hide_password') : t('auth.show_password')
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} color={colors.textMuted} strokeWidth={1.8} />
                  ) : (
                    <Eye size={18} color={colors.textMuted} strokeWidth={1.8} />
                  )}
                </Pressable>
              }
            />

            <AuthField
              label={t('auth.register.confirm_password')}
              value={confirmPassword}
              onChangeText={(v) => {
                setConfirmPassword(v);
                clearErrors();
                checkPasswordMatch(password, v);
              }}
              onBlur={() => checkPasswordMatch(password, confirmPassword)}
              secureTextEntry={!showConfirm}
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={onSubmit}
              placeholder="••••••••"
              error={fieldErrors.confirmPassword}
              leftIcon={<Lock size={18} color={colors.textMuted} strokeWidth={1.8} />}
              rightIcon={
                <Pressable
                  onPress={() => setShowConfirm((v) => !v)}
                  hitSlop={12}
                  accessibilityRole="button"
                >
                  {showConfirm ? (
                    <EyeOff size={18} color={colors.textMuted} strokeWidth={1.8} />
                  ) : (
                    <Eye size={18} color={colors.textMuted} strokeWidth={1.8} />
                  )}
                </Pressable>
              }
            />

            <Text
              style={{
                fontFamily: 'GolosText_400Regular',
                fontSize: 12,
                lineHeight: 18,
                color: colors.textMuted,
              }}
            >
              {t('auth.register.consent_prefix')}{' '}
              <Text
                onPress={() => void Linking.openURL(TERMS_URL)}
                style={{ color: colors.primary, fontFamily: 'GolosText_500Medium' }}
              >
                {t('auth.register.terms')}
              </Text>{' '}
              {t('auth.register.consent_and')}{' '}
              <Text
                onPress={() => void Linking.openURL(PRIVACY_URL)}
                style={{ color: colors.primary, fontFamily: 'GolosText_500Medium' }}
              >
                {t('auth.register.privacy')}
              </Text>
              {t('auth.register.consent_suffix')}
            </Text>

            {formError ? (
              <Text
                style={{
                  fontFamily: 'GolosText_400Regular',
                  fontSize: 13,
                  lineHeight: 18,
                  color: colors.error,
                }}
              >
                {formError}
              </Text>
            ) : submitBlockedReason ? (
              <Text
                style={{
                  fontFamily: 'GolosText_400Regular',
                  fontSize: 13,
                  lineHeight: 18,
                  color: colors.error,
                }}
              >
                {submitBlockedReason}
              </Text>
            ) : null}

            <PrimaryButton
              title={t('auth.register.submit')}
              onPress={onSubmit}
              loading={loading}
              disabled={loading || emailCheck.state === 'checking'}
            />

            <Pressable
              onPress={() => router.replace('/login')}
              style={{
                alignSelf: 'stretch',
                paddingVertical: 4,
                paddingHorizontal: Platform.OS === 'android' ? 8 : 4,
              }}
            >
              <Text
                maxFontSizeMultiplier={1.15}
                style={{
                  fontFamily: 'GolosText_400Regular',
                  fontSize: 14,
                  lineHeight: 22,
                  color: colors.textSecondary,
                  textAlign: 'center',
                  includeFontPadding: false,
                  paddingHorizontal: Platform.OS === 'android' ? 6 : 0,
                }}
              >
                {`${t('auth.register.have_account')} `}
                <Text
                  maxFontSizeMultiplier={1.15}
                  style={{
                    color: colors.primary,
                    fontFamily: 'GolosText_600SemiBold',
                    includeFontPadding: false,
                  }}
                >
                  {`${t('auth.sign_in')}\u00A0`}
                </Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <LanguageBottomSheet visible={langOpen} onClose={() => setLangOpen(false)} />
    </View>
  );
}
