import { Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { Text } from '@/components/ui/Text';
import type { TimelineItem, TimelineKind } from '@/utils/doctorDashboard';

const KIND_COLOR: Record<TimelineKind, { dot: string; bg: string; text: string }> = {
  completed: { dot: '#16A34A', bg: 'rgba(22,163,74,0.12)', text: '#16A34A' },
  current: { dot: '#4338CA', bg: 'rgba(67,56,202,0.12)', text: '#4338CA' },
  upcoming: { dot: '#6366F1', bg: 'rgba(99,102,241,0.12)', text: '#4338CA' },
  cancelled: { dot: '#EF4444', bg: 'rgba(239,68,68,0.12)', text: '#EF4444' },
  available: { dot: '#94A3B8', bg: 'rgba(148,163,184,0.16)', text: '#64748B' },
};

function statusLabel(kind: TimelineKind, t: (key: string) => string): string {
  switch (kind) {
    case 'completed':
      return t('appointments.status_completed');
    case 'current':
      return t('doctor_app.status_current');
    case 'cancelled':
      return t('appointments.status_cancelled');
    case 'available':
      return t('doctor_app.status_available');
    default:
      return t('appointments.status_upcoming');
  }
}

export function TimelineAppointment({
  item,
  isLast,
  onPress,
}: {
  item: TimelineItem;
  isLast?: boolean;
  onPress?: () => void;
}) {
  const { t } = useTranslation();
  const { colors, isDark } = useLoginTheme();
  const androidPad = Platform.OS === 'android' ? { paddingRight: 8 } : null;
  const tone = KIND_COLOR[item.kind];
  const filled = item.kind !== 'available';
  const body = (
    <View style={{ flexDirection: 'row', gap: 12, minHeight: 64 }}>
      <View style={{ width: 48, paddingTop: 2, flexShrink: 0 }}>
        <Text
          maxFontSizeMultiplier={1}
          style={{
            fontFamily: 'GolosText_600SemiBold',
            fontSize: 13,
            lineHeight: 18,
            color: colors.textMuted,
            fontVariant: ['tabular-nums'],
          }}
        >
          {item.time}
        </Text>
      </View>
      <View style={{ width: 16, alignItems: 'center', flexShrink: 0 }}>
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: filled ? tone.dot : 'transparent',
            borderWidth: filled ? 0 : 1.5,
            borderColor: tone.dot,
            marginTop: 4,
          }}
        />
        {isLast ? null : (
          <View
            style={{
              width: 1,
              flex: 1,
              marginTop: 4,
              backgroundColor: isDark ? 'rgba(148,163,184,0.22)' : 'rgba(15,23,42,0.1)',
            }}
          />
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0, paddingBottom: 18, gap: 3 }}>
        <Text
          maxFontSizeMultiplier={1.1}
          style={{
            fontFamily: 'GolosText_600SemiBold',
            fontSize: 15,
            lineHeight: 20,
            color: item.kind === 'available' ? colors.textMuted : colors.text,
            ...androidPad,
          }}
        >
          {item.appointment?.patientName ?? t('doctor_app.status_available')}
        </Text>
        {item.appointment ? null : (
          <Text
            maxFontSizeMultiplier={1.1}
            style={{
              fontFamily: 'GolosText_400Regular',
              fontSize: 13,
              lineHeight: 18,
              color: colors.textSecondary,
              ...androidPad,
            }}
          >
            {t('doctor_app.minutes_short', { count: item.durationMinutes })}
          </Text>
        )}
        <View style={{ alignSelf: 'flex-start', marginTop: 4 }}>
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 8,
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : tone.bg,
            }}
          >
            <Text
              style={{
                fontFamily: 'GolosText_600SemiBold',
                fontSize: 11,
                lineHeight: 14,
                color: isDark ? colors.textSecondary : tone.text,
              }}
            >
              {statusLabel(item.kind, t)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (!onPress) return body;
  return (
    <ScalePressable accessibilityLabel={item.appointment?.patientName} onPress={onPress}>
      {body}
    </ScalePressable>
  );
}
