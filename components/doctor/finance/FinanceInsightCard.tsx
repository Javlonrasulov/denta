import { Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { Text } from '@/components/ui/Text';
import type { DoctorFinanceInsights } from '@/utils/doctorFinance';
import { formatSom } from '@/utils/slots';

function Cell({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const { colors } = useLoginTheme();
  return (
    <View style={{ flex: 1, minWidth: 0, gap: 4, paddingVertical: 4, paddingHorizontal: 6 }}>
      <Text
        numberOfLines={1}
        style={{
          fontFamily: 'Geologica_600SemiBold',
          fontSize: 10,
          lineHeight: 13,
          letterSpacing: 0.3,
          color: colors.textMuted,
        }}
      >
        {label}
      </Text>
      <Text
        numberOfLines={1}
        maxFontSizeMultiplier={1}
        style={{
          fontFamily: 'Geologica_700Bold',
          fontSize: 14,
          lineHeight: 18,
          letterSpacing: -0.2,
          color: colors.text,
          ...(Platform.OS === 'android' ? { paddingRight: 2 } : null),
        }}
      >
        {value}
      </Text>
    </View>
  );
}

export function FinanceInsightCard({ insights }: { insights: DoctorFinanceInsights }) {
  const { t } = useTranslation();
  const { hairline, authSurface } = useLoginTheme();

  return (
    <Animated.View
      entering={FadeInDown.duration(250).delay(130)}
      style={{
        backgroundColor: authSurface,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: hairline,
        paddingVertical: 10,
        paddingHorizontal: 6,
        gap: 8,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Cell
          label={t('doctor_finance.top_service')}
          value={insights.topService ?? '—'}
        />
        <View style={{ width: 1, height: 32, backgroundColor: hairline }} />
        <Cell
          label={t('doctor_finance.average_check')}
          value={`${formatSom(insights.averageCheck)} ${t('common.currency')}`}
        />
      </View>
      <View style={{ height: 1, backgroundColor: hairline, marginHorizontal: 6 }} />
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Cell label={t('doctor_finance.patients_period')} value={String(insights.patientsCount)} />
        <View style={{ width: 1, height: 32, backgroundColor: hairline }} />
        <Cell
          label={t('doctor_finance.per_patient')}
          value={`${formatSom(insights.revenuePerPatient)} ${t('common.currency')}`}
        />
      </View>
    </Animated.View>
  );
}
