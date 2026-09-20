import { Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { SLOT_TONE, statusKey } from '@/components/doctor/calendar/calendarTokens';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { Text } from '@/components/ui/Text';
import type { CalendarSlot } from '@/utils/doctorCalendar';

export function AppointmentBlock({
  slot,
  compact,
  onPress,
}: {
  slot: CalendarSlot;
  compact?: boolean;
  onPress?: () => void;
}) {
  const { t } = useTranslation();
  const { colors, isDark } = useLoginTheme();
  const tone = SLOT_TONE[slot.kind];
  const appointment = slot.appointment;
  if (!appointment) return null;

  const body = (
    <View
      style={{
        flex: 1,
        minHeight: 0,
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: compact ? 8 : 10,
        backgroundColor: isDark ? tone.bgDark : tone.bg,
        borderLeftWidth: 3,
        borderLeftColor: tone.accent,
        justifyContent: 'center',
        gap: 3,
        opacity: slot.kind === 'cancelled' ? 0.72 : 1,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text
          maxFontSizeMultiplier={1}
          numberOfLines={1}
          style={{
            flex: 1,
            minWidth: 0,
            fontFamily: 'GolosText_600SemiBold',
            fontSize: compact ? 14 : 15,
            lineHeight: 20,
            color: colors.text,
            textDecorationLine: slot.kind === 'cancelled' ? 'line-through' : 'none',
            ...(Platform.OS === 'android' ? { paddingRight: 4 } : null),
          }}
        >
          {appointment.patientName}
        </Text>
        <View
          style={{
            paddingHorizontal: 7,
            paddingVertical: 2,
            borderRadius: 7,
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.55)',
          }}
        >
          <Text
            maxFontSizeMultiplier={1}
            style={{
              fontFamily: 'GolosText_600SemiBold',
              fontSize: 10,
              lineHeight: 13,
              color: isDark ? tone.labelDark : tone.label,
            }}
          >
            {t(statusKey(slot.kind))}
          </Text>
        </View>
      </View>
      <Text
        maxFontSizeMultiplier={1}
        numberOfLines={1}
        style={{
          fontFamily: 'GolosText_400Regular',
          fontSize: 12,
          lineHeight: 16,
          color: colors.textSecondary,
        }}
      >
        {appointment.serviceName}
      </Text>
      <Text
        maxFontSizeMultiplier={1}
        style={{
          fontFamily: 'GolosText_500Medium',
          fontSize: 11,
          lineHeight: 14,
          color: colors.textMuted,
          fontVariant: ['tabular-nums'],
        }}
      >
        {slot.start} – {slot.end}
      </Text>
    </View>
  );

  if (!onPress) return body;
  return (
    <ScalePressable
      accessibilityLabel={appointment.patientName}
      onPress={onPress}
      style={{ flex: 1, height: '100%', width: '100%' }}
    >
      {body}
    </ScalePressable>
  );
}
