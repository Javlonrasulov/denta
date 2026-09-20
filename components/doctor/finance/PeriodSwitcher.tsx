import { Platform, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { Text } from '@/components/ui/Text';
import type { FinancePeriod } from '@/utils/doctorFinance';

const PERIODS: FinancePeriod[] = ['today', 'week', 'month', 'year'];

export function PeriodSwitcher({
  value,
  onChange,
}: {
  value: FinancePeriod;
  onChange: (value: FinancePeriod) => void;
}) {
  const { t } = useTranslation();
  const { colors, field, hairline, ctaText } = useLoginTheme();

  return (
    <Animated.View entering={FadeInDown.duration(240).delay(30)}>
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: field,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: hairline,
          padding: 4,
          gap: 4,
        }}
      >
        {PERIODS.map((period) => {
          const selected = value === period;
          return (
            <ScalePressable
              key={period}
              accessibilityLabel={t(`doctor_finance.period_${period}`)}
              onPress={() => {
                void Haptics.selectionAsync();
                onChange(period);
              }}
              style={{
                flex: 1,
                height: 36,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: selected ? colors.primary : 'transparent',
              }}
            >
              <Text
                maxFontSizeMultiplier={1}
                style={{
                  fontFamily: selected ? 'GolosText_600SemiBold' : 'GolosText_500Medium',
                  fontSize: 13,
                  lineHeight: 16,
                  color: selected ? ctaText : colors.textSecondary,
                  ...(Platform.OS === 'android' ? { paddingRight: 2 } : null),
                }}
              >
                {t(`doctor_finance.period_${period}`)}
              </Text>
            </ScalePressable>
          );
        })}
      </View>
    </Animated.View>
  );
}
