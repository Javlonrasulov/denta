import { Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { TrendingDown, TrendingUp } from '@/components/icons';
import { Text } from '@/components/ui/Text';
import { formatSom } from '@/utils/slots';

export function RevenueWidget({
  amount,
  deltaPct,
}: {
  amount: number;
  deltaPct: number | null;
}) {
  const { t } = useTranslation();
  const { colors } = useLoginTheme();
  const androidPad = Platform.OS === 'android' ? { paddingRight: 6 } : null;
  const up = (deltaPct ?? 0) >= 0;
  const Trend = up ? TrendingUp : TrendingDown;
  const trendColor = up ? colors.success : colors.error;

  return (
    <Animated.View
      entering={FadeInDown.duration(280).delay(110)}
      style={{
        flex: 1,
        minWidth: 0,
        gap: 8,
        paddingRight: 8,
      }}
    >
      <Text
        style={{
          fontFamily: 'Geologica_600SemiBold',
          fontSize: 11,
          lineHeight: 14,
          letterSpacing: 0.6,
          color: colors.textMuted,
        }}
      >
        {t('doctor_app.todays_income')}
      </Text>
      <Text
        maxFontSizeMultiplier={1}
        style={{
          fontFamily: 'Geologica_700Bold',
          fontSize: 20,
          lineHeight: 26,
          letterSpacing: -0.3,
          color: colors.text,
          ...androidPad,
        }}
      >
        {`${formatSom(amount)} ${t('common.currency')}`}
      </Text>
      {deltaPct != null ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Trend size={14} color={trendColor} strokeWidth={2} />
          <Text
            style={{
              flex: 1,
              fontFamily: 'GolosText_500Medium',
              fontSize: 12,
              lineHeight: 16,
              color: trendColor,
              ...androidPad,
            }}
          >
            {`${deltaPct > 0 ? '+' : ''}${deltaPct}% ${t('common.vs_yesterday')}`}
          </Text>
        </View>
      ) : null}
    </Animated.View>
  );
}
