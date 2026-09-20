import { Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { Text } from '@/components/ui/Text';

function Ring({ progress, size = 72 }: { progress: number; size?: number }) {
  const { colors, isDark } = useLoginTheme();
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, progress));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={isDark ? 'rgba(165,180,252,0.16)' : 'rgba(67,56,202,0.12)'}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.primary}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - pct)}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text
        maxFontSizeMultiplier={1}
        style={{
          fontFamily: 'Geologica_700Bold',
          fontSize: 15,
          lineHeight: 18,
          color: colors.text,
        }}
      >
        {`${Math.round(pct * 100)}%`}
      </Text>
    </View>
  );
}

export function TodayProgress({
  patients,
  completed,
  remaining,
  total,
}: {
  patients: number;
  completed: number;
  remaining: number;
  total: number;
}) {
  const { t } = useTranslation();
  const { colors, hairline } = useLoginTheme();
  const androidPad = Platform.OS === 'android' ? { paddingRight: 6 } : null;
  const stats = [
    { value: patients, label: t('doctor_app.patients_short') },
    { value: completed, label: t('doctor_app.completed_short') },
    { value: remaining, label: t('doctor_app.remaining_short') },
  ];

  return (
    <Animated.View entering={FadeInDown.duration(280).delay(80)} style={{ gap: 12 }}>
      <Text
        style={{
          fontFamily: 'Geologica_600SemiBold',
          fontSize: 11,
          lineHeight: 14,
          letterSpacing: 1.4,
          color: colors.textMuted,
        }}
      >
        {t('common.today').toUpperCase()}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          paddingVertical: 4,
        }}
      >
        <Ring progress={total === 0 ? 0 : completed / total} />
        <View style={{ flex: 1, minWidth: 0, gap: 10 }}>
          <Text
            maxFontSizeMultiplier={1.1}
            style={{
              fontFamily: 'GolosText_500Medium',
              fontSize: 13,
              lineHeight: 18,
              color: colors.textSecondary,
              ...androidPad,
            }}
          >
            {t('doctor_app.progress_label', { completed, total })}
          </Text>
          <View style={{ flexDirection: 'row' }}>
            {stats.map((stat, index) => (
              <View
                key={stat.label}
                style={{
                  flex: 1,
                  paddingLeft: index === 0 ? 0 : 10,
                  borderLeftWidth: index === 0 ? 0 : 1,
                  borderLeftColor: hairline,
                  gap: 2,
                }}
              >
                <Text
                  maxFontSizeMultiplier={1}
                  style={{
                    fontFamily: 'Geologica_700Bold',
                    fontSize: 20,
                    lineHeight: 24,
                    color: colors.text,
                  }}
                >
                  {stat.value}
                </Text>
                <Text
                  numberOfLines={1}
                  maxFontSizeMultiplier={1.05}
                  style={{
                    fontFamily: 'GolosText_400Regular',
                    fontSize: 11,
                    lineHeight: 14,
                    color: colors.textMuted,
                    ...androidPad,
                  }}
                >
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
