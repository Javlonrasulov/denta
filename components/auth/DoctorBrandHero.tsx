import { Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { BrandLockup } from '@/components/brand/BrandLockup';
import { Text } from '@/components/ui/Text';
import { APP_VARIANT } from '@/constants/appVariant';
import { useLoginTheme } from '@/components/auth/loginTheme';

const SCHEDULE = [
  { time: '09:00', key: 'auth.schedule_patient' },
  { time: '10:30', key: 'auth.schedule_consult' },
  { time: '12:00', key: 'auth.schedule_available' },
] as const;

const fontPad = Platform.OS === 'android' ? { paddingRight: 10 } : null;

export function DoctorBrandHero({
  compact,
  showSchedule = true,
}: {
  compact?: boolean;
  showSchedule?: boolean;
}) {
  const { t } = useTranslation();
  const { colors, hairline } = useLoginTheme();
  const isDoctor = APP_VARIANT === 'doctor';

  return (
    <Animated.View
      entering={FadeInDown.duration(520).delay(40)}
      style={{
        alignSelf: 'stretch',
        width: '100%',
        alignItems: 'center',
        gap: compact ? 16 : 24,
      }}
    >
      <BrandLockup variant={APP_VARIANT} size="lg" compact={compact} />

      <Text
        style={{
          alignSelf: 'stretch',
          width: '100%',
          fontFamily: 'GolosText_400Regular',
          fontSize: 15,
          lineHeight: 24,
          textAlign: 'center',
          color: colors.textSecondary,
          paddingHorizontal: 12,
          ...fontPad,
        }}
      >
        {t(isDoctor ? 'auth.tagline' : 'auth.tagline_generic')}
      </Text>

      {isDoctor && showSchedule ? (
        <View style={{ alignSelf: 'center', flexDirection: 'row', paddingTop: compact ? 0 : 4 }}>
          <View style={{ width: 14, alignItems: 'center', marginRight: 12 }}>
            <View
              style={{
                position: 'absolute',
                top: 12,
                bottom: 12,
                width: 1,
                backgroundColor: hairline,
              }}
            />
            {SCHEDULE.map((row, index) => (
              <View
                key={`dot-${row.time}`}
                style={{
                  height: compact ? 24 : 28,
                  justifyContent: 'center',
                }}
              >
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: index === 2 ? colors.secondary : colors.primary,
                    opacity: 0.85,
                  }}
                />
              </View>
            ))}
          </View>
          <View style={{ flexShrink: 0 }}>
            {SCHEDULE.map((row) => (
              <View
                key={row.time}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  height: compact ? 24 : 28,
                  gap: 16,
                }}
              >
                <View style={{ width: 56, justifyContent: 'center', flexShrink: 0 }}>
                  <Text
                    maxFontSizeMultiplier={1}
                    style={{
                      fontFamily: 'GolosText_500Medium',
                      fontSize: 12,
                      lineHeight: 16,
                      color: colors.textMuted,
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    {row.time}
                  </Text>
                </View>
                <Text
                  maxFontSizeMultiplier={1}
                  style={{
                    flexShrink: 0,
                    fontFamily: 'GolosText_500Medium',
                    fontSize: 13,
                    lineHeight: 18,
                    color: colors.textSecondary,
                    ...fontPad,
                  }}
                >
                  {t(row.key)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </Animated.View>
  );
}
