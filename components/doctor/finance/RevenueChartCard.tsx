import { useEffect, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { Text } from '@/components/ui/Text';
import type { FinancePeriod, FinanceTrendPoint } from '@/utils/doctorFinance';
import { formatTrendLabel } from '@/utils/doctorFinance';
import { formatSom } from '@/utils/slots';

function Bar({
  ratio,
  selected,
  delay,
  onPress,
}: {
  ratio: number;
  selected: boolean;
  delay: number;
  onPress: () => void;
}) {
  const { colors, isDark } = useLoginTheme();
  const barHeight = Math.max(8, Math.round(ratio * 108));

  return (
    <Pressable onPress={onPress} style={{ flex: 1, alignItems: 'center', minWidth: 0 }}>
      <View style={{ height: 112, width: '100%', justifyContent: 'flex-end', alignItems: 'center' }}>
        <Animated.View
          entering={FadeInUp.delay(delay).duration(380)}
          style={{
            height: barHeight,
            width: 12,
            borderRadius: 7,
            backgroundColor: selected
              ? colors.primary
              : isDark
                ? 'rgba(129,140,248,0.34)'
                : 'rgba(67,56,202,0.28)',
          }}
        />
      </View>
    </Pressable>
  );
}

export function RevenueChartCard({
  period,
  points,
}: {
  period: FinancePeriod;
  points: FinanceTrendPoint[];
}) {
  const { t, i18n } = useTranslation();
  const { colors, authSurface, hairline } = useLoginTheme();
  const peak = Math.max(...points.map((point) => point.value), 1);
  const richest = points.reduce((best, point, index) => {
    if (point.value > (points[best]?.value ?? -1)) return index;
    return best;
  }, 0);
  const [selected, setSelected] = useState(richest);
  const current = points[selected] ?? points[0];

  useEffect(() => {
    setSelected(richest);
  }, [period, richest]);

  return (
    <Animated.View
      entering={FadeInDown.duration(260).delay(80)}
      style={{
        backgroundColor: authSurface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: hairline,
        padding: 16,
        gap: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <Text
          style={{
            flex: 1,
            fontFamily: 'Geologica_600SemiBold',
            fontSize: 16,
            lineHeight: 22,
            color: colors.text,
          }}
        >
          {t('doctor_finance.chart_title')}
        </Text>
        {current ? (
          <Text
            maxFontSizeMultiplier={1}
            style={{
              fontFamily: 'Geologica_700Bold',
              fontSize: 13,
              lineHeight: 18,
              color: colors.primary,
              ...(Platform.OS === 'android' ? { paddingRight: 4 } : null),
            }}
          >
            {`${formatSom(current.value)} ${t('common.currency')}`}
          </Text>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 112, gap: 4 }}>
        {points.map((point, index) => (
          <Bar
            key={`${period}-${point.key}`}
            ratio={point.value / peak}
            selected={selected === index}
            delay={40 + index * 28}
            onPress={() => setSelected(index)}
          />
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 4 }}>
        {points.map((point, index) => (
          <Text
            key={`${point.key}-label`}
            maxFontSizeMultiplier={1}
            center
            style={{
              flex: 1,
              fontFamily: selected === index ? 'GolosText_600SemiBold' : 'GolosText_400Regular',
              fontSize: 10,
              lineHeight: 13,
              color: selected === index ? colors.primary : colors.textMuted,
            }}
          >
            {formatTrendLabel(point, period, i18n.language)}
          </Text>
        ))}
      </View>
    </Animated.View>
  );
}
