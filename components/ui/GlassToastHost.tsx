import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AlertCircle, X } from '@/components/icons';
import { Text } from '@/components/ui/Text';
import { useLoginTheme } from '@/components/auth/loginTheme';
import { useToastStore, type AppToast, type ToastTone } from '@/store/toastStore';

const TONE_COLOR: Record<ToastTone, string> = {
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#4338CA',
  success: '#16A34A',
};

function toneFromMessage(message: string): ToastTone {
  if (/error|exception|syntaxerror/i.test(message)) return 'error';
  if (/warn|reanimated/i.test(message)) return 'warning';
  return 'info';
}

function stringifyWarn(args: unknown[]): string {
  return args
    .map((arg) => {
      if (typeof arg === 'string') return arg;
      if (arg instanceof Error) return arg.message;
      return '';
    })
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function shouldSurface(message: string): boolean {
  if (!message) return false;
  if (message.includes('NO_COLOR') || message.includes('FORCE_COLOR')) return false;
  if (message.includes('Require cycle')) return false;
  return (
    message.includes('[Reanimated]') ||
    message.includes('Warning:') ||
    message.includes('SyntaxError') ||
    message.startsWith('Error:')
  );
}

export function GlassToastHost() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useLoginTheme();
  const toast = useToastStore((s) => s.toast);
  const showToast = useToastStore((s) => s.showToast);
  const dismissToast = useToastStore((s) => s.dismissToast);
  const visible = useSharedValue(0);
  const lastToast = useRef<AppToast | null>(null);
  const [, setFrame] = useState(0);

  if (toast) lastToast.current = toast;
  const displayed = toast ?? lastToast.current;

  useEffect(() => {
    if (!__DEV__) return;
    const originalWarn = console.warn;
    const originalError = console.error;
    console.warn = (...args: unknown[]) => {
      originalWarn(...args);
      const message = stringifyWarn(args);
      if (!shouldSurface(message)) return;
      showToast({
        tone: toneFromMessage(message),
        title: t('common.toast_warning'),
        message,
      });
    };
    console.error = (...args: unknown[]) => {
      originalError(...args);
      const message = stringifyWarn(args);
      if (!shouldSurface(message)) return;
      showToast({
        tone: 'error',
        title: t('common.toast_error'),
        message,
      });
    };
    return () => {
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, [showToast, t]);

  useEffect(() => {
    visible.value = withTiming(toast ? 1 : 0, {
      duration: 280,
      easing: Easing.out(Easing.cubic),
    });
    if (toast) {
      const hide = setTimeout(() => dismissToast(), 5600);
      return () => clearTimeout(hide);
    }
    const clear = setTimeout(() => {
      lastToast.current = null;
      setFrame((n) => n + 1);
    }, 300);
    return () => clearTimeout(clear);
  }, [toast, visible, dismissToast]);

  const panelStyle = useAnimatedStyle(() => ({
    opacity: visible.value,
    transform: [{ translateY: (1 - visible.value) * -18 }],
  }));

  if (!displayed) return null;

  const accent = TONE_COLOR[displayed.tone];
  const glass = isDark ? 'rgba(15, 23, 42, 0.52)' : 'rgba(255, 255, 255, 0.48)';
  const shine = isDark
    ? (['rgba(165,180,252,0.16)', 'rgba(15,23,42,0.08)'] as const)
    : (['rgba(255,255,255,0.72)', 'rgba(227,233,244,0.28)'] as const);

  return (
    <View
      pointerEvents={toast ? 'box-none' : 'none'}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        elevation: 24,
        paddingTop: insets.top + 8,
        paddingHorizontal: 16,
      }}
    >
      <Animated.View style={panelStyle}>
        <View
          style={{
            borderRadius: 22,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: isDark ? 'rgba(226,232,240,0.14)' : 'rgba(255,255,255,0.7)',
            backgroundColor: glass,
            ...Platform.select({
              ios: {
                shadowColor: '#0F172A',
                shadowOpacity: isDark ? 0.35 : 0.12,
                shadowRadius: 24,
                shadowOffset: { width: 0, height: 10 },
              },
              android: { elevation: 10 },
              default: {},
            }),
          }}
        >
          <LinearGradient
            colors={shine}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 12,
              paddingVertical: 14,
              paddingLeft: 14,
              paddingRight: 10,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: `${accent}22`,
                borderWidth: 1,
                borderColor: `${accent}33`,
              }}
            >
              <AlertCircle size={18} color={accent} strokeWidth={2} />
            </View>
            <View style={{ flex: 1, minWidth: 0, gap: 3, paddingTop: 1 }}>
              <Text
                maxFontSizeMultiplier={1.1}
                style={{
                  fontFamily: 'Geologica_600SemiBold',
                  fontSize: 13,
                  lineHeight: 18,
                  color: colors.text,
                }}
              >
                {displayed.title}
              </Text>
              <Text
                maxFontSizeMultiplier={1.1}
                numberOfLines={3}
                style={{
                  fontFamily: 'GolosText_400Regular',
                  fontSize: 13,
                  lineHeight: 18,
                  color: colors.textSecondary,
                }}
              >
                {displayed.message}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              onPress={dismissToast}
              hitSlop={8}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={16} color={colors.textMuted} strokeWidth={2} />
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
