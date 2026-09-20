import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { Wallet } from '@/components/icons';
import { Text } from '@/components/ui/Text';
import type { FinancePeriod } from '@/utils/doctorFinance';

export function FinanceEmpty({
  period,
  filtered,
  onAdd,
}: {
  period: FinancePeriod;
  filtered?: boolean;
  onAdd?: () => void;
}) {
  const { t } = useTranslation();
  const { colors, hairline, isDark } = useLoginTheme();
  const title = filtered
    ? t('doctor_finance.empty_filtered')
    : period === 'today'
      ? t('doctor_finance.empty_title')
      : t('doctor_finance.empty_period');

  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 36,
        paddingHorizontal: 20,
        gap: 12,
      }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 24,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDark ? 'rgba(129,140,248,0.12)' : 'rgba(67,56,202,0.08)',
          borderWidth: 1,
          borderColor: hairline,
        }}
      >
        <Wallet size={28} color={colors.primary} strokeWidth={1.7} />
      </View>
      <Text
        center
        style={{
          fontFamily: 'Geologica_600SemiBold',
          fontSize: 18,
          lineHeight: 24,
          color: colors.text,
        }}
      >
        {title}
      </Text>
      <Text
        center
        style={{
          fontFamily: 'GolosText_400Regular',
          fontSize: 14,
          lineHeight: 20,
          color: colors.textMuted,
          maxWidth: 280,
        }}
      >
        {t('doctor_finance.empty_subtitle')}
      </Text>
      {!filtered && onAdd ? (
        <ScalePressable
          accessibilityLabel={t('doctor_finance.add_payment')}
          onPress={onAdd}
          style={{
            marginTop: 8,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: colors.primary,
            paddingHorizontal: 16,
            height: 44,
            borderRadius: 22,
          }}
        >
          <Text
            style={{
              fontFamily: 'GolosText_600SemiBold',
              fontSize: 14,
              color: '#FFFFFF',
            }}
          >
            {t('doctor_finance.add_payment')}
          </Text>
        </ScalePressable>
      ) : null}
    </View>
  );
}
