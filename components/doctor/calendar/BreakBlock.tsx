import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { SLOT_TONE } from '@/components/doctor/calendar/calendarTokens';
import { Clock } from '@/components/icons';
import { Text } from '@/components/ui/Text';
import type { CalendarSlot } from '@/utils/doctorCalendar';

export function BreakBlock({ slot }: { slot: CalendarSlot }) {
  const { t } = useTranslation();
  const { colors, isDark } = useLoginTheme();
  const tone = SLOT_TONE.break;

  return (
    <View
      style={{
        flex: 1,
        minHeight: 0,
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: isDark ? tone.bgDark : tone.bg,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: isDark ? 'rgba(148,163,184,0.28)' : 'rgba(148,163,184,0.5)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <Clock size={16} color={colors.textMuted} strokeWidth={1.8} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text
          maxFontSizeMultiplier={1}
          style={{
            fontFamily: 'GolosText_600SemiBold',
            fontSize: 14,
            lineHeight: 18,
            color: colors.textSecondary,
          }}
        >
          {t('doctor_app.status_break')}
        </Text>
        <Text
          maxFontSizeMultiplier={1}
          style={{
            fontFamily: 'GolosText_400Regular',
            fontSize: 12,
            lineHeight: 16,
            color: colors.textMuted,
            fontVariant: ['tabular-nums'],
          }}
        >
          {slot.start} – {slot.end}
        </Text>
      </View>
    </View>
  );
}
