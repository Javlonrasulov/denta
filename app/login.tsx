import { Redirect, router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { Check, ChevronDown, Globe, Moon, Sun, Eye, EyeOff } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { APP_DISPLAY_NAME, LOCKED_ROLE } from '@/constants/appVariant';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/theme';
import { LocaleCode } from '@/types';

const LOCALES: { code: LocaleCode; label: string; short: string; flag: string }[] = [
  { code: 'uz', label: 'O‘zbekcha', short: 'UZ', flag: '🇺🇿' },
  { code: 'uz-Cyrl', label: 'Ўзбекча', short: 'ЎЗ', flag: '🇺🇿' },
  { code: 'ru', label: 'Русский', short: 'RU', flag: '🇷🇺' },
  { code: 'en', label: 'English', short: 'EN', flag: '🇬🇧' },
];

const LANG_MENU_WIDTH = 220;

export default function LoginScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { colors, spacing, radius, shadows, isDark, iconSizes } = useTheme();
  const isAuthenticated = useSettingsStore((s) => s.isAuthenticated);
  const login = useSettingsStore((s) => s.login);
  const setRole = useSettingsStore((s) => s.setRole);
  const locale = useSettingsStore((s) => s.locale);
  const setLocale = useSettingsStore((s) => s.setLocale);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);

  const [loginValue, setLoginValue] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [langPos, setLangPos] = useState({ top: 56, right: 8 });
  const langBtnRef = useRef<View>(null);

  const currentLocale = LOCALES.find((item) => item.code === locale) ?? LOCALES[0];

  if (isAuthenticated) {
    return <Redirect href="/" />;
  }

  const openLanguageMenu = () => {
    langBtnRef.current?.measureInWindow((x, y, width, height) => {
      setLangPos({
        top: y + height + 8,
        right: Math.max(8, windowWidth - x - width),
      });
      setLangOpen(true);
    });
  };

  const onSubmit = () => {
    const trimmedLogin = loginValue.trim();
    if (!trimmedLogin) {
      setError(t('auth.invalid_login'));
      return;
    }
    if (password.length < 4) {
      setError(t('auth.invalid_password'));
      return;
    }

    setError('');
    setLoading(true);
    // Mock auth — later replace with NestJS API
    setTimeout(() => {
      const name = trimmedLogin.includes('@')
        ? trimmedLogin.split('@')[0]
        : trimmedLogin;
      login({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        login: trimmedLogin,
        password,
      });
      if (LOCKED_ROLE) setRole(LOCKED_ROLE);
      setLoading(false);
      router.replace('/');
    }, 450);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: insets.top + spacing.xl,
            paddingBottom: insets.bottom + spacing['2xl'],
            paddingHorizontal: spacing.xl,
            justifyContent: 'center',
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={{
              position: 'absolute',
              top: insets.top + spacing.md,
              right: spacing.xl,
              flexDirection: 'row',
              gap: spacing.sm,
              zIndex: 2,
            }}
          >
            <View ref={langBtnRef} collapsable={false}>
              <Pressable
                onPress={openLanguageMenu}
                accessibilityRole="button"
                accessibilityLabel={t('profile.language')}
                style={{
                  height: 40,
                  paddingHorizontal: spacing.md,
                  borderRadius: radius.md,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Globe size={16} color={colors.textSecondary} />
                <Text variant="caption" weight="semibold">
                  {currentLocale.label}
                </Text>
                <ChevronDown size={14} color={colors.textMuted} />
              </Pressable>
            </View>
            <Pressable
              onPress={() => setThemeMode(isDark ? 'light' : 'dark')}
              accessibilityRole="button"
              accessibilityLabel={t('profile.dark_mode')}
              style={{
                width: 40,
                height: 40,
                borderRadius: radius.md,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isDark ? (
                <Sun size={16} color={colors.textSecondary} />
              ) : (
                <Moon size={16} color={colors.textSecondary} />
              )}
            </Pressable>
          </View>

          <Animated.View
            entering={FadeInUp.springify()}
            style={{
              alignSelf: 'center',
              width: '100%',
              maxWidth: 420,
              gap: spacing.xl,
            }}
          >
            <View style={{ gap: spacing.sm, alignItems: 'center' }}>
              <Text variant="display" color={colors.primary} style={{ textAlign: 'center' }}>
                {APP_DISPLAY_NAME}
              </Text>
              <Text variant="h2" style={{ textAlign: 'center' }}>
                {t('auth.title')}
              </Text>
            </View>

            <Animated.View
              entering={FadeInDown.delay(80).springify()}
              style={{
                backgroundColor: colors.surface,
                borderRadius: radius.xl,
                padding: spacing['2xl'],
                gap: spacing.lg,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                ...shadows.md,
              }}
            >
              <Input
                label={t('auth.login')}
                value={loginValue}
                onChangeText={(v) => {
                  setLoginValue(v);
                  if (error) setError('');
                }}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="username"
                placeholder="admin"
              />
              <Input
                label={t('auth.password')}
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  if (error) setError('');
                }}
                secureTextEntry={!showPassword}
                textContentType="password"
                placeholder="••••••••"
                onSubmitEditing={onSubmit}
                returnKeyType="go"
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
                      <EyeOff size={iconSizes.md} color={colors.textMuted} />
                    ) : (
                      <Eye size={iconSizes.md} color={colors.textMuted} />
                    )}
                  </Pressable>
                }
              />

              {error ? (
                <Text variant="caption" color={colors.error}>
                  {error}
                </Text>
              ) : (
                <Text variant="caption" muted>
                  {t('auth.demo_hint')}
                </Text>
              )}

              <Button
                title={t('auth.sign_in')}
                onPress={onSubmit}
                loading={loading}
                fullWidth
                size="lg"
              />
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={langOpen} transparent animationType="fade" onRequestClose={() => setLangOpen(false)}>
        <View style={{ flex: 1 }}>
          <Pressable
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
            onPress={() => setLangOpen(false)}
          />
          <View
            style={{
              position: 'absolute',
              top: langPos.top,
              right: langPos.right,
              width: Math.min(LANG_MENU_WIDTH, windowWidth - 16),
              backgroundColor: colors.surfaceElevated,
              borderRadius: radius.xl,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              padding: spacing.xs,
              ...shadows.lg,
            }}
          >
            <Text
              variant="caption"
              muted
              style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}
            >
              {t('profile.language')}
            </Text>
            {LOCALES.map((item) => {
              const active = item.code === locale;
              return (
                <Pressable
                  key={item.code}
                  onPress={() => {
                    setLocale(item.code);
                    setLangOpen(false);
                  }}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: 12,
                    borderRadius: radius.md,
                    backgroundColor: active
                      ? colors.primaryMuted
                      : pressed
                        ? colors.surfaceSoft
                        : 'transparent',
                  })}
                >
                  <Text variant="body" style={{ fontSize: 18, lineHeight: 22 }}>
                    {item.flag}
                  </Text>
                  <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
                    <Text
                      variant="label"
                      color={active ? colors.primary : colors.text}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                    <Text variant="caption" muted numberOfLines={1}>
                      {item.short}
                    </Text>
                  </View>
                  {active ? <Check size={16} color={colors.primary} /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>
    </View>
  );
}
