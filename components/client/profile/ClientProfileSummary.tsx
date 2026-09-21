import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { CalendarDays, Heart, Mail, Phone } from '@/components/icons';
import { Text } from '@/components/ui/Text';

function SummaryChip({
  icon: Icon,
  label,
  value,
  onPress,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const { colors, hairline, isDark } = useLoginTheme();

  return (
    <ScalePressable
      accessibilityLabel={`${label}: ${value}`}
      onPress={onPress}
      disabled={!onPress}
      style={{
        flex: 1,
        minWidth: 0,
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderRadius: 16,
        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
        borderWidth: 1,
        borderColor: hairline,
        alignItems: 'center',
        gap: 6,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: isDark ? 'rgba(129,140,248,0.14)' : 'rgba(67,56,202,0.08)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={15} color={colors.primary} strokeWidth={1.9} />
      </View>
      <Text
        numberOfLines={1}
        maxFontSizeMultiplier={1}
        style={{
          fontFamily: 'Geologica_700Bold',
          fontSize: 18,
          lineHeight: 22,
          letterSpacing: -0.3,
          color: colors.text,
        }}
      >
        {value}
      </Text>
      <Text
        numberOfLines={1}
        maxFontSizeMultiplier={1}
        style={{
          fontFamily: 'GolosText_500Medium',
          fontSize: 11,
          lineHeight: 14,
          color: colors.textMuted,
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </ScalePressable>
  );
}

export function ClientProfileSummary({
  appointmentsCount,
  favoritesCount,
  phone,
  email,
  onAppointments,
  onFavorites,
}: {
  appointmentsCount: number;
  favoritesCount: number;
  phone?: string;
  email?: string;
  onAppointments?: () => void;
  onFavorites?: () => void;
}) {
  const { t } = useTranslation();
  const { colors, hairline, isDark } = useLoginTheme();

  return (
    <Animated.View entering={FadeInDown.delay(40).duration(320)} style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <SummaryChip
          icon={CalendarDays}
          label={t('profile.stat_appointments')}
          value={String(appointmentsCount)}
          onPress={onAppointments}
        />
        <SummaryChip
          icon={Heart}
          label={t('profile.stat_favorites')}
          value={String(favoritesCount)}
          onPress={onFavorites}
        />
      </View>

      <View
        style={{
          borderRadius: 16,
          borderWidth: 1,
          borderColor: hairline,
          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
          paddingHorizontal: 14,
          paddingVertical: 12,
          gap: 8,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Phone size={14} color={colors.textMuted} strokeWidth={1.9} />
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              fontFamily: 'GolosText_500Medium',
              fontSize: 13,
              lineHeight: 18,
              color: phone?.trim() ? colors.textSecondary : colors.textMuted,
            }}
          >
            {phone?.trim() || t('profile.phone_missing')}
          </Text>
        </View>
        <View style={{ height: 1, backgroundColor: hairline }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Mail size={14} color={colors.textMuted} strokeWidth={1.9} />
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              fontFamily: 'GolosText_500Medium',
              fontSize: 13,
              lineHeight: 18,
              color: email?.trim() ? colors.textSecondary : colors.textMuted,
            }}
          >
            {email?.trim() || t('profile.email_missing')}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}
