import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { TimelineSlot } from '@/components/doctor/calendar/TimelineSlot';
import { Text } from '@/components/ui/Text';
import type { CalendarSlot } from '@/utils/doctorCalendar';
import { formatMinutes, slotHeight, slotTop, timelineHeight } from '@/utils/doctorCalendar';

export function DayTimeline({
  slots,
  workStartMinutes,
  workEndMinutes,
  nowMinutes,
  showNow,
  onAppointment,
  onAddFree,
}: {
  slots: CalendarSlot[];
  workStartMinutes: number;
  workEndMinutes: number;
  nowMinutes: number;
  showNow?: boolean;
  onAppointment?: (slot: CalendarSlot) => void;
  onAddFree?: (slot: CalendarSlot) => void;
}) {
  const { t } = useTranslation();
  const { colors, isDark } = useLoginTheme();
  const height = timelineHeight(workStartMinutes, workEndMinutes);
  const labels: number[] = [];
  for (let minute = workStartMinutes; minute <= workEndMinutes; minute += 30) {
    labels.push(minute);
  }

  const nowTop = slotTop(nowMinutes, workStartMinutes);
  const nowVisible =
    Boolean(showNow) && nowMinutes >= workStartMinutes - 5 && nowMinutes <= workEndMinutes + 5;

  return (
    <Animated.View entering={FadeIn.duration(280)} style={{ minHeight: height + 8 }}>
      <View style={{ height, position: 'relative' }}>
        {labels.map((minute) => (
          <View
            key={minute}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: slotTop(minute, workStartMinutes),
              flexDirection: 'row',
              alignItems: 'flex-start',
            }}
          >
            <Text
              maxFontSizeMultiplier={1}
              style={{
                width: 44,
                fontFamily: 'GolosText_500Medium',
                fontSize: 11,
                lineHeight: 14,
                color: colors.textMuted,
                fontVariant: ['tabular-nums'],
                marginTop: -7,
              }}
            >
              {formatMinutes(minute)}
            </Text>
            <View
              style={{
                flex: 1,
                height: 1,
                backgroundColor: isDark ? 'rgba(148,163,184,0.12)' : 'rgba(15,23,42,0.06)',
              }}
            />
          </View>
        ))}

        {slots.map((slot) => (
          <View
            key={slot.id}
            style={{
              position: 'absolute',
              left: 48,
              right: 0,
              top: slotTop(slot.startMinutes, workStartMinutes) + 2,
              height: slotHeight(slot.durationMinutes) - 6,
            }}
          >
            <TimelineSlot slot={slot} onAppointment={onAppointment} onAddFree={onAddFree} />
          </View>
        ))}

        {nowVisible ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: nowTop,
              flexDirection: 'row',
              alignItems: 'center',
              zIndex: 6,
            }}
          >
            <View
              style={{
                width: 44,
                alignItems: 'flex-start',
                marginTop: -8,
              }}
            >
              <View
                style={{
                  paddingHorizontal: 5,
                  paddingVertical: 2,
                  borderRadius: 6,
                  backgroundColor: colors.error,
                }}
              >
                <Text
                  maxFontSizeMultiplier={1}
                  style={{
                    fontFamily: 'Geologica_700Bold',
                    fontSize: 8,
                    lineHeight: 10,
                    letterSpacing: 0.2,
                    color: '#FFFFFF',
                  }}
                >
                  {t('doctor_app.now_indicator')}
                </Text>
              </View>
            </View>
            <View style={{ flex: 1, height: 1.5, borderRadius: 1, backgroundColor: colors.error, opacity: 0.85 }} />
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 4,
                backgroundColor: colors.error,
                marginLeft: -2,
              }}
            />
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}
