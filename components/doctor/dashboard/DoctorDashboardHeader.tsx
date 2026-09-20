import { Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { Bell } from '@/components/icons';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { Avatar } from '@/components/ui/Avatar';
import { Text } from '@/components/ui/Text';

const TASHKENT = 'Asia/Tashkent';

function hourInTashkent(date = new Date()): number {
  try {
    const hour = new Intl.DateTimeFormat('en-GB', {
      timeZone: TASHKENT,
      hour: 'numeric',
      hourCycle: 'h23',
    }).formatToParts(date).find((part) => part.type === 'hour')?.value;
    const parsed = Number(hour);
    return Number.isFinite(parsed) ? parsed : date.getHours();
  } catch {
    return date.getHours();
  }
}

function formatHeaderDate(date: Date, locale: string): string {
  const map: Record<string, string> = {
    uz: 'uz-Latn-UZ',
    'uz-Cyrl': 'uz-Cyrl-UZ',
    ru: 'ru-RU',
    en: 'en-GB',
  };
  const intlLocale = map[locale] ?? 'uz-Latn-UZ';
  try {
    const parts = new Intl.DateTimeFormat(intlLocale, {
      timeZone: TASHKENT,
      day: 'numeric',
      month: 'long',
      weekday: 'long',
    }).formatToParts(date);
    const day = parts.find((p) => p.type === 'day')?.value ?? '';
    const month = parts.find((p) => p.type === 'month')?.value ?? '';
    const weekday = parts.find((p) => p.type === 'weekday')?.value ?? '';
    const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
    return `${day} ${cap(month)}, ${cap(weekday)}`;
  } catch {
    return date.toDateString();
  }
}

function greetingKey(date = new Date()): 'home.good_morning' | 'home.good_afternoon' | 'home.good_evening' {
  const hour = hourInTashkent(date);
  if (hour < 12) return 'home.good_morning';
  if (hour < 18) return 'home.good_afternoon';
  return 'home.good_evening';
}

export function DoctorDashboardHeader({
  doctorName,
  photoUrl,
  alertCount,
  onNotify,
  onProfile,
}: {
  doctorName: string;
  photoUrl?: string;
  alertCount?: number;
  onNotify?: () => void;
  onProfile?: () => void;
}) {
  const { t, i18n } = useTranslation();
  const { colors, hairline, field, isDark } = useLoginTheme();
  const androidPad = Platform.OS === 'android' ? { paddingRight: 8 } : null;

  return (
    <Animated.View
      entering={FadeInDown.duration(280)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <Text
          maxFontSizeMultiplier={1.1}
          style={{
            fontFamily: 'GolosText_400Regular',
            fontSize: 13,
            lineHeight: 18,
            color: colors.textMuted,
            ...androidPad,
          }}
        >
          {t(greetingKey())}
        </Text>
        <Text
          maxFontSizeMultiplier={1.05}
          style={{
            fontFamily: 'Geologica_700Bold',
            fontSize: 26,
            lineHeight: 32,
            letterSpacing: -0.4,
            color: colors.text,
            ...androidPad,
          }}
        >
          {doctorName}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
          <Text
            maxFontSizeMultiplier={1.1}
            style={{
              flexShrink: 1,
              fontFamily: 'GolosText_400Regular',
              fontSize: 13,
              lineHeight: 18,
              color: colors.textSecondary,
              ...androidPad,
            }}
          >
            {formatHeaderDate(new Date(), i18n.language)}
          </Text>
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 8,
              backgroundColor: isDark ? 'rgba(129,140,248,0.16)' : 'rgba(67,56,202,0.1)',
            }}
          >
            <Text
              style={{
                fontFamily: 'Geologica_600SemiBold',
                fontSize: 10,
                lineHeight: 13,
                letterSpacing: 1.2,
                color: colors.primary,
              }}
            >
              {t('doctor_app.role_label')}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <ScalePressable
          accessibilityLabel={t('doctor_app.alerts')}
          onPress={onNotify}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: field,
            borderWidth: 1,
            borderColor: hairline,
          }}
        >
          <Bell size={18} color={colors.textSecondary} strokeWidth={1.8} />
          {alertCount ? (
            <View
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.primary,
              }}
            />
          ) : null}
        </ScalePressable>
        <ScalePressable accessibilityLabel={t('tabs.profile')} onPress={onProfile}>
          <Avatar uri={photoUrl} name={doctorName} size={44} />
        </ScalePressable>
      </View>
    </Animated.View>
  );
}
