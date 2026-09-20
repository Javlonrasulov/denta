import { Platform, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { TrendingDown, TrendingUp } from '@/components/icons';
import { Text } from '@/components/ui/Text';
import type { DoctorFinanceModel, FinancePeriod } from '@/utils/doctorFinance';
import { formatSom } from '@/utils/slots';

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  const { colors } = useLoginTheme();
  return (
    <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
      <Text
        maxFontSizeMultiplier={1}
        numberOfLines={1}
        style={{
          fontFamily: 'Geologica_600SemiBold',
          fontSize: 10,
          lineHeight: 13,
          letterSpacing: 0.5,
          color: colors.textMuted,
        }}
      >
        {label}
      </Text>
      <Text
        maxFontSizeMultiplier={1}
        numberOfLines={1}
        style={{
          fontFamily: 'Geologica_700Bold',
          fontSize: 13,
          lineHeight: 17,
          letterSpacing: -0.2,
          color: tone ?? colors.text,
          ...(Platform.OS === 'android' ? { paddingRight: 2 } : null),
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function revenueLabel(period: FinancePeriod): string {
  if (period === 'week') return 'doctor_finance.week_revenue';
  if (period === 'month') return 'doctor_finance.month_revenue';
  if (period === 'year') return 'doctor_finance.year_revenue';
  return 'doctor_finance.today_revenue';
}

export function FinanceSummaryHero({
  model,
  onAddPayment,
  onAddExpense,
}: {
  model: DoctorFinanceModel;
  onAddPayment?: () => void;
  onAddExpense?: () => void;
}) {
  const { t } = useTranslation();
  const { colors, hairline, isDark } = useLoginTheme();
  const androidPad = Platform.OS === 'android' ? { paddingRight: 6 } : null;
  const up = (model.deltaPct ?? 0) >= 0;
  const Trend = up ? TrendingUp : TrendingDown;
  const trendColor = up ? colors.success : colors.error;
  const vsKey = model.period === 'today' ? 'doctor_finance.vs_yesterday' : 'doctor_finance.vs_previous';

  return (
    <Animated.View entering={FadeInDown.duration(300).delay(50)}>
      <LinearGradient
        colors={
          isDark ? (['#1B2150', '#151D2E'] as const) : (['#EEF2FF', '#E4E9FA'] as const)
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 22,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(165,180,252,0.18)' : 'rgba(67,56,202,0.12)',
          padding: 18,
          gap: 14,
        }}
      >
        <Text
          style={{
            fontFamily: 'Geologica_600SemiBold',
            fontSize: 11,
            lineHeight: 14,
            letterSpacing: 1.1,
            color: colors.primary,
          }}
        >
          {t(revenueLabel(model.period))}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: 6 }}>
          <Text
            maxFontSizeMultiplier={1}
            style={{
              fontFamily: 'Geologica_700Bold',
              fontSize: 34,
              lineHeight: 40,
              letterSpacing: -0.9,
              color: colors.text,
              ...androidPad,
            }}
          >
            {formatSom(model.revenue)}
          </Text>
          <Text
            style={{
              fontFamily: 'GolosText_500Medium',
              fontSize: 15,
              lineHeight: 20,
              color: colors.textSecondary,
            }}
          >
            {t('common.currency')}
          </Text>
        </View>

        {model.deltaPct != null ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Trend size={14} color={trendColor} strokeWidth={2} />
            <Text
              style={{
                fontFamily: 'GolosText_500Medium',
                fontSize: 13,
                lineHeight: 17,
                color: trendColor,
                ...androidPad,
              }}
            >
              {`${model.deltaPct > 0 ? '+' : ''}${model.deltaPct}% ${t(vsKey)}`}
            </Text>
          </View>
        ) : null}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: isDark ? 'rgba(15,23,42,0.28)' : 'rgba(255,255,255,0.55)',
            borderRadius: 14,
            borderWidth: 1,
            borderColor: hairline,
            paddingVertical: 10,
            paddingHorizontal: 10,
          }}
        >
          <Metric label={t('finance.income')} value={formatSom(model.revenue)} tone={colors.success} />
          <View style={{ width: 1, height: 28, backgroundColor: hairline }} />
          <View style={{ width: 10 }} />
          <Metric label={t('finance.expenses')} value={formatSom(model.expenses)} tone={colors.warning} />
          <View style={{ width: 1, height: 28, backgroundColor: hairline }} />
          <View style={{ width: 10 }} />
          <Metric label={t('doctor_finance.profit')} value={formatSom(model.netIncome)} />
        </View>

        {model.pendingAmount > 0 ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              paddingVertical: 8,
              paddingHorizontal: 10,
              borderRadius: 12,
              backgroundColor: isDark ? 'rgba(251,191,36,0.12)' : 'rgba(245,158,11,0.1)',
            }}
          >
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <Text
                style={{
                  fontFamily: 'GolosText_600SemiBold',
                  fontSize: 12,
                  lineHeight: 16,
                  color: colors.warning,
                }}
              >
                {t('doctor_finance.outstanding')}
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: 'GolosText_400Regular',
                  fontSize: 11,
                  lineHeight: 15,
                  color: colors.textSecondary,
                }}
              >
                {t('doctor_finance.outstanding_hint', { count: model.pendingCount })}
              </Text>
            </View>
            <Text
              maxFontSizeMultiplier={1}
              style={{
                fontFamily: 'Geologica_700Bold',
                fontSize: 14,
                lineHeight: 18,
                color: colors.warning,
                ...androidPad,
              }}
            >
              {`${formatSom(model.pendingAmount)} ${t('common.currency')}`}
            </Text>
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <ScalePressable
            accessibilityLabel={t('doctor_finance.add_payment')}
            onPress={onAddPayment}
            style={{
              flex: 1,
              height: 40,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.primary,
            }}
          >
            <Text
              style={{
                fontFamily: 'GolosText_600SemiBold',
                fontSize: 13,
                color: '#FFFFFF',
              }}
            >
              {t('doctor_finance.add_payment')}
            </Text>
          </ScalePressable>
          <ScalePressable
            accessibilityLabel={t('doctor_finance.add_expense')}
            onPress={onAddExpense}
            style={{
              flex: 1,
              height: 40,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isDark ? 'rgba(15,23,42,0.35)' : 'rgba(255,255,255,0.62)',
              borderWidth: 1,
              borderColor: hairline,
            }}
          >
            <Text
              style={{
                fontFamily: 'GolosText_600SemiBold',
                fontSize: 13,
                color: colors.text,
              }}
            >
              {t('doctor_finance.add_expense')}
            </Text>
          </ScalePressable>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}
