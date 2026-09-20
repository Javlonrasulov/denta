import { Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Svg, { Circle } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { Text } from '@/components/ui/Text';
import type { ServiceBreakdownItem } from '@/utils/doctorFinance';
import { formatSom } from '@/utils/slots';

const TONES = ['#4338CA', '#0891B2', '#6366F1', '#0F766E', '#7C3AED'];
const DARK_TONES = ['#818CF8', '#22D3EE', '#A5B4FC', '#2DD4BF', '#C4B5FD'];

export function ServicesBreakdown({ items }: { items: ServiceBreakdownItem[] }) {
  const { t } = useTranslation();
  const { colors, authSurface, hairline, isDark } = useLoginTheme();
  const visible = items.slice(0, 4);
  const palette = isDark ? DARK_TONES : TONES;
  const total = visible.reduce((sum, item) => sum + item.amount, 0) || 1;
  const size = 78;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const arcs = visible.map((item, index) => {
    const len = (item.amount / total) * c;
    const next = { ...item, len, offset, color: palette[index % palette.length] };
    offset += len;
    return next;
  });

  if (visible.length === 0) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(260).delay(110)}
      style={{
        backgroundColor: authSurface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: hairline,
        padding: 16,
        gap: 14,
      }}
    >
      <Text
        style={{
          fontFamily: 'Geologica_600SemiBold',
          fontSize: 16,
          lineHeight: 22,
          color: colors.text,
        }}
      >
        {t('doctor_finance.services_title')}
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
          <Svg width={size} height={size}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={isDark ? 'rgba(148,163,184,0.16)' : 'rgba(15,23,42,0.06)'}
              strokeWidth={stroke}
              fill="none"
            />
            {arcs.map((arc) => (
              <Circle
                key={arc.name}
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={arc.color}
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={`${arc.len} ${c - arc.len}`}
                strokeDashoffset={-arc.offset}
                strokeLinecap="butt"
                rotation={-90}
                origin={`${size / 2}, ${size / 2}`}
              />
            ))}
          </Svg>
        </View>

        <View style={{ flex: 1, minWidth: 0, gap: 10 }}>
          {arcs.map((item) => (
            <View key={item.name} style={{ gap: 5 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: item.color }} />
                <Text
                  numberOfLines={1}
                  style={{
                    flex: 1,
                    fontFamily: 'GolosText_500Medium',
                    fontSize: 12,
                    lineHeight: 16,
                    color: colors.text,
                  }}
                >
                  {item.name}
                </Text>
                <Text
                  maxFontSizeMultiplier={1}
                  style={{
                    fontFamily: 'Geologica_600SemiBold',
                    fontSize: 12,
                    lineHeight: 16,
                    color: colors.text,
                    ...(Platform.OS === 'android' ? { paddingRight: 2 } : null),
                  }}
                >
                  {formatSom(item.amount)}
                </Text>
              </View>
              <View
                style={{
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: isDark ? 'rgba(148,163,184,0.12)' : 'rgba(15,23,42,0.06)',
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    width: `${Math.max(8, Math.round(item.share * 100))}%`,
                    height: '100%',
                    borderRadius: 2,
                    backgroundColor: item.color,
                    opacity: 0.85,
                  }}
                />
              </View>
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}
