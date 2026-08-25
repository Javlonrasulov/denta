import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { Globe, Moon, Sun } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/theme';
import { LocaleCode } from '@/types';

const LOCALES: { code: LocaleCode; label: string }[] = [
  { code: 'uz', label: 'O‘zbekcha' },
  { code: 'uz-Cyrl', label: 'Ўзбекча' },
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
];

export default function LoginScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius, shadows, isDark } = useTheme();
  const isAuthenticated = useSettingsStore((s) => s.isAuthenticated);
  const login = useSettingsStore((s) => s.login);
  const locale = useSettingsStore((s) => s.locale);
  const setLocale = useSettingsStore((s) => s.setLocale);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);

  const [email, setEmail] = useState('admin@denta.uz');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Redirect href="/" />;
  }

  const onSubmit = () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError(t('auth.invalid_email'));
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
      const name = trimmedEmail.split('@')[0] || 'Admin';
      login(name.charAt(0).toUpperCase() + name.slice(1));
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
            <Pressable
              onPress={() => {
                const idx = LOCALES.findIndex((l) => l.code === locale);
                setLocale(LOCALES[(idx + 1) % LOCALES.length].code);
              }}
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
                {LOCALES.find((l) => l.code === locale)?.label ?? 'UZ'}
              </Text>
            </Pressable>
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
            <View style={{ gap: spacing.sm }}>
              <Text variant="display" color={colors.primary}>
                {t('common.app_name')}
              </Text>
              <Text variant="h2">{t('auth.title')}</Text>
              <Text variant="body" muted>
                {t('auth.subtitle')}
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
                label={t('auth.email')}
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  if (error) setError('');
                }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                placeholder="admin@denta.uz"
              />
              <Input
                label={t('auth.password')}
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  if (error) setError('');
                }}
                secureTextEntry
                textContentType="password"
                placeholder="••••••••"
                onSubmitEditing={onSubmit}
                returnKeyType="go"
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
    </View>
  );
}
