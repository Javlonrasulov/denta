import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { Plus } from '@/components/icons';
import { Text } from '@/components/ui/Text';
import type { CalendarSlot } from '@/utils/doctorCalendar';

export function FreeSlotBlock({
  slot,
  onAdd,
}: {
  slot: CalendarSlot;
  onAdd?: () => void;
}) {
  const { t } = useTranslation();
  const { colors, hairline, isDark } = useLoginTheme();

  return (
    <View
      style={{
        flex: 1,
        minHeight: 0,
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: hairline,
        backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.45)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text
          maxFontSizeMultiplier={1}
          style={{
            fontFamily: 'GolosText_500Medium',
            fontSize: 13,
            lineHeight: 18,
            color: colors.textMuted,
          }}
        >
          {t('doctor_app.status_free_slot')}
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
      <ScalePressable
        accessibilityLabel={t('doctor_app.add_appointment_cta')}
        onPress={onAdd}
        style={{
          height: 30,
          paddingHorizontal: 10,
          borderRadius: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          backgroundColor: isDark ? 'rgba(129,140,248,0.16)' : 'rgba(67,56,202,0.08)',
        }}
      >
        <Plus size={13} color={colors.primary} strokeWidth={2.2} />
        <Text
          maxFontSizeMultiplier={1}
          style={{
            fontFamily: 'GolosText_600SemiBold',
            fontSize: 11,
            lineHeight: 14,
            color: colors.primary,
          }}
        >
          {t('doctor_app.add_short')}
        </Text>
      </ScalePressable>
    </View>
  );
}
