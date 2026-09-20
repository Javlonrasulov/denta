import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { Text } from '@/components/ui/Text';
import type { Appointment } from '@/types';
import type { MonthCell } from '@/utils/doctorCalendar';

export function MonthGrid({
  title,
  cells,
  selectedAppointments,
  onSelectDay,
  onOpenDay,
  onAppointment,
}: {
  title: string;
  cells: MonthCell[];
  selectedAppointments: Appointment[];
  onSelectDay: (key: string) => void;
  onOpenDay?: () => void;
  onAppointment?: (id: string) => void;
}) {
  const { t } = useTranslation();
  const { colors, hairline, isDark } = useLoginTheme();

  return (
    <Animated.View entering={FadeInDown.duration(260)} style={{ gap: 16 }}>
      <Text
        style={{
          fontFamily: 'Geologica_700Bold',
          fontSize: 18,
          lineHeight: 24,
          color: colors.text,
        }}
      >
        {title}
      </Text>

      <View
        style={{
          borderRadius: 22,
          borderWidth: 1,
          borderColor: hairline,
          backgroundColor: isDark ? '#151D2E' : '#F4F6FB',
          padding: 12,
          gap: 8,
        }}
      >
        <View style={{ flexDirection: 'row' }}>
          {Array.from({ length: 7 }, (_, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}>
              <Text
                maxFontSizeMultiplier={1}
                style={{
                  fontFamily: 'Geologica_600SemiBold',
                  fontSize: 11,
                  lineHeight: 14,
                  color: colors.textMuted,
                }}
              >
                {t(`doctor_app.wd_${i}`)}
              </Text>
            </View>
          ))}
        </View>

        {Array.from({ length: Math.ceil(cells.length / 7) }, (_, row) => (
          <View key={row} style={{ flexDirection: 'row' }}>
            {cells.slice(row * 7, row * 7 + 7).map((cell) => {
              const selected = cell.isSelected;
              return (
                <ScalePressable
                  key={cell.key}
                  accessibilityLabel={cell.key}
                  onPress={() => onSelectDay(cell.key)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    height: 44,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 12,
                    backgroundColor: selected ? colors.primary : 'transparent',
                  }}
                >
                  <Text
                    maxFontSizeMultiplier={1}
                    style={{
                      fontFamily: cell.isToday || selected ? 'Geologica_700Bold' : 'GolosText_500Medium',
                      fontSize: 13,
                      lineHeight: 16,
                      color: selected
                        ? '#FFFFFF'
                        : cell.inMonth
                          ? colors.text
                          : colors.textMuted,
                      opacity: cell.inMonth ? 1 : 0.4,
                    }}
                  >
                    {cell.day}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 2, height: 6, marginTop: 2 }}>
                    {Array.from({ length: Math.min(cell.count, 3) }).map((_, i) => (
                      <View
                        key={i}
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: 2,
                          backgroundColor: selected ? '#FFFFFF' : colors.primary,
                        }}
                      />
                    ))}
                  </View>
                </ScalePressable>
              );
            })}
          </View>
        ))}
      </View>

      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text
            style={{
              fontFamily: 'GolosText_600SemiBold',
              fontSize: 14,
              lineHeight: 20,
              color: colors.text,
            }}
          >
            {t('doctor_app.selected_day_visits')}
          </Text>
          <ScalePressable onPress={onOpenDay}>
            <Text
              style={{
                fontFamily: 'GolosText_600SemiBold',
                fontSize: 13,
                lineHeight: 18,
                color: colors.primary,
              }}
            >
              {t('doctor_app.open_day')}
            </Text>
          </ScalePressable>
        </View>
        {selectedAppointments.length === 0 ? (
          <Text
            style={{
              fontFamily: 'GolosText_400Regular',
              fontSize: 13,
              lineHeight: 18,
              color: colors.textMuted,
            }}
          >
            {t('doctor_app.empty_day_short')}
          </Text>
        ) : (
          selectedAppointments.map((apt) => (
            <ScalePressable
              key={apt.id}
              onPress={() => onAppointment?.(apt.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderBottomColor: hairline,
              }}
            >
              <Text
                style={{
                  width: 48,
                  fontFamily: 'GolosText_600SemiBold',
                  fontSize: 13,
                  lineHeight: 18,
                  color: colors.primary,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {apt.time}
              </Text>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: 'GolosText_600SemiBold',
                    fontSize: 14,
                    lineHeight: 20,
                    color: colors.text,
                  }}
                >
                  {apt.patientName}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: 'GolosText_400Regular',
                    fontSize: 12,
                    lineHeight: 16,
                    color: colors.textMuted,
                  }}
                >
                  {apt.serviceName}
                </Text>
              </View>
            </ScalePressable>
          ))
        )}
      </View>
    </Animated.View>
  );
}
