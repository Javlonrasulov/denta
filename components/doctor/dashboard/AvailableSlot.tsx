import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { Text } from '@/components/ui/Text';
import type { NextSlot } from '@/utils/doctorDashboard';

export function AvailableSlot({
  slot,
  onPress,
}: {
  slot: NextSlot | null;
  onPress?: () => void;
}) {
  const { t } = useTranslation();
  const { colors, hairline } = useLoginTheme();
  const androidPad = Platform.OS === 'android' ? { paddingRight: 6 } : null;

  return (
    <Animated.View
      entering={FadeInDown.duration(280).delay(110)}
      style={{
        flex: 1,
        minWidth: 0,
        paddingLeft: 16,
        borderLeftWidth: 1,
        borderLeftColor: hairline,
        gap: 8,
      }}
    >
      <Text
        style={{
          fontFamily: 'Geologica_600SemiBold',
          fontSize: 11,
          lineHeight: 14,
          letterSpacing: 0.6,
          color: colors.textMuted,
        }}
      >
        {t('doctor_app.next_free_slot')}
      </Text>
      <Text
        maxFontSizeMultiplier={1}
        style={{
          fontFamily: 'Geologica_700Bold',
          fontSize: 18,
          lineHeight: 24,
          color: colors.text,
          fontVariant: ['tabular-nums'],
          ...androidPad,
        }}
      >
        {slot ? `${slot.start} – ${slot.end}` : '—'}
      </Text>
      {slot ? (
        <Text
          style={{
            fontFamily: 'GolosText_400Regular',
            fontSize: 12,
            lineHeight: 16,
            color: colors.textMuted,
          }}
        >
          {t('doctor_app.minutes_short', { count: slot.durationMinutes })}
        </Text>
      ) : null}
      <ScalePressable onPress={onPress} accessibilityLabel={t('doctor_app.view_schedule')}>
        <Text
          style={{
            fontFamily: 'GolosText_600SemiBold',
            fontSize: 13,
            lineHeight: 18,
            color: colors.primary,
            ...androidPad,
          }}
        >
          {t('doctor_app.view_schedule')}
        </Text>
      </ScalePressable>
    </Animated.View>
  );
}
