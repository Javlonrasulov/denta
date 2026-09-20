import { useEffect, useState } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  useWindowDimensions,
  View,
} from 'react-native';
import { Redirect, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { AuthField } from '@/components/auth/AuthField';
import { DentalBackdrop } from '@/components/auth/DentalBackdrop';
import { DoctorBrandHero } from '@/components/auth/DoctorBrandHero';
import { LanguageBottomSheet } from '@/components/auth/LanguageBottomSheet';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { ThemeToggle } from '@/components/auth/ThemeToggle';
import { useLoginTheme } from '@/components/auth/loginTheme';
import { Eye, EyeOff, Globe, Lock, UserRound } from '@/components/icons';
import { Text } from '@/components/ui/Text';
import { LOCALE_OPTIONS } from '@/components/ui/LanguageMenu';
import { APP_VARIANT, LOCKED_ROLE } from '@/constants/appVariant';
import { useSettingsStore } from '@/store/settingsStore';

const SPRING = { damping: 20, stiffness: 240, mass: 0.8 };

export function DoctorLoginScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
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
  const login = useSettingsStore((s) => s.login);
  const setRole = useSettingsStore((s) => s.setRole);
  const locale = useSettingsStore((s) => s.locale);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);

  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const currentLocale = LOCALE_OPTIONS.find((item) => item.code === locale) ?? LOCALE_OPTIONS[0];
  const compact = height < 740;
  const isDoctor = APP_VARIANT === 'doctor';

  const translateY = useSharedValue(0);
  const dragStart = useSharedValue(0);
  const minY = useSharedValue(-Math.max(height * 0.42, 280));

  useEffect(() => {
    minY.value = -Math.max(height * 0.42, 280);
  }, [height, minY]);

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        const lift = -Math.min(event.endCoordinates.height - 24, Math.abs(minY.value));
        translateY.value = withSpring(lift, SPRING);
      },
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        translateY.value = withSpring(0, SPRING);
      },
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, [minY, translateY]);

  const pan = Gesture.Pan()
    .activeOffsetY([-12, 12])
    .failOffsetX([-24, 24])
    .onStart(() => {
      dragStart.value = translateY.value;
    })
    .onUpdate((event) => {
      const next = dragStart.value + event.translationY;
      translateY.value = Math.min(0, Math.max(minY.value, next));
    })
    .onEnd((event) => {
      const projected = translateY.value + event.velocityY * 0.12;
      const midpoint = minY.value / 2;
      const target = projected < midpoint ? minY.value : 0;
      translateY.value = withSpring(target, SPRING);
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (isAuthenticated) {
    return <Redirect href="/" />;
  }

  const clearErrors = () => {
    if (loginError) setLoginError('');
    if (passwordError) setPasswordError('');
    if (formError) setFormError('');
  };

  const onSubmit = () => {
    const trimmedLogin = loginValue.trim();
    if (!trimmedLogin) {
      setLoginError(t('auth.invalid_login'));
      setPasswordError('');
      setFormError('');
      return;
    }
    if (password.length < 4) {
      setPasswordError(t('auth.invalid_password'));
      setLoginError('');
      setFormError('');
      return;
    }

    clearErrors();
    setLoading(true);
    void (async () => {
      try {
        const { loginWithPassword } = await import('@/services/authService');
        await loginWithPassword(trimmedLogin, password);
        if (LOCKED_ROLE) setRole(LOCKED_ROLE);
        router.replace('/');
      } catch (err) {
        const message =
          err instanceof Error ? err.message : t('auth.invalid_credentials');
        setFormError(message);
      } finally {
        setLoading(false);
      }
    })();
  };

  return (
    <View style={{ flex: 1, backgroundColor: canvas }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <LinearGradient
        colors={[canvas, canvasMid, authSurface]}
        locations={[0, 0.46, 1]}
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
      />
      <DentalBackdrop />

      <View
        style={{
          position: 'absolute',
          top: insets.top + 12,
          right: 20,
          zIndex: 4,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
      >
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
              lineHeight: 16,
              letterSpacing: 0.4,
              color: colors.text,
              paddingRight: 4,
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

      <View
        pointerEvents="none"
        style={{
          flex: 1,
          paddingTop: insets.top + 56,
          paddingHorizontal: 24,
          paddingBottom: Math.min(height * 0.42, 380),
          justifyContent: 'center',
        }}
      >
        <DoctorBrandHero compact={compact} showSchedule />
      </View>

      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: -140,
          zIndex: 3,
        }}
      >
        <Animated.View
          style={[
            {
              backgroundColor: authSurface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              borderTopWidth: 1,
              borderColor: hairline,
              paddingHorizontal: 24,
              paddingTop: 8,
              paddingBottom: Math.max(insets.bottom, 16) + 156,
              gap: 20,
            },
            sheetStyle,
          ]}
        >
        <GestureDetector gesture={pan}>
          <View
            collapsable={false}
            style={{ alignItems: 'center', paddingVertical: 10 }}
            accessibilityRole="adjustable"
            accessibilityLabel={t('auth.title')}
          >
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
        </GestureDetector>

          <View style={{ gap: 8 }}>
            <Text
              style={{
                alignSelf: 'stretch',
                width: '100%',
                fontFamily: 'Geologica_700Bold',
                fontSize: 26,
                lineHeight: 32,
                letterSpacing: -0.2,
                color: colors.text,
                paddingRight: 8,
              }}
            >
              {t('auth.welcome')}
            </Text>
            <Text
              style={{
                alignSelf: 'stretch',
                width: '100%',
                fontFamily: 'GolosText_400Regular',
                fontSize: 15,
                lineHeight: 22,
                color: colors.textSecondary,
                paddingRight: 8,
              }}
            >
              {t(isDoctor ? 'auth.welcome_subtitle' : 'auth.welcome_subtitle_generic')}
            </Text>
          </View>

          <View style={{ gap: 16 }}>
            <AuthField
              label={t('auth.login')}
              value={loginValue}
              onChangeText={(value) => {
                setLoginValue(value);
                clearErrors();
              }}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="username"
              keyboardType="email-address"
              returnKeyType="next"
              placeholder={t('auth.login_placeholder')}
              error={loginError}
              leftIcon={<UserRound size={18} color={colors.textMuted} strokeWidth={1.8} />}
            />
            <AuthField
              label={t('auth.password')}
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                clearErrors();
              }}
              secureTextEntry={!showPassword}
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={onSubmit}
              placeholder="••••••••"
              error={passwordError}
              leftIcon={<Lock size={18} color={colors.textMuted} strokeWidth={1.8} />}
              rightIcon={
                <Pressable
                  onPress={() => setShowPassword((value) => !value)}
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
          </View>

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
          ) : null}

          <PrimaryButton
            title={t('auth.sign_in')}
            onPress={onSubmit}
            loading={loading}
            disabled={loading}
          />

          {__DEV__ ? (
            <Pressable
              onPress={() => {
                setLoginValue('admin');
                setPassword('demo');
                clearErrors();
              }}
              hitSlop={8}
              style={{ alignSelf: 'center' }}
            >
              <Text
                style={{
                  fontFamily: 'GolosText_400Regular',
                  fontSize: 11,
                  lineHeight: 14,
                  color: colors.textMuted,
                  opacity: 0.45,
                }}
              >
                DEV
              </Text>
            </Pressable>
          ) : null}
        </Animated.View>
      </View>

      <LanguageBottomSheet visible={langOpen} onClose={() => setLangOpen(false)} />
    </View>
  );
}
