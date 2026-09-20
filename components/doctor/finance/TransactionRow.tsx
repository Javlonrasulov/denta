import { Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { PaymentStatusBadge } from '@/components/doctor/finance/PaymentStatusBadge';
import { Text } from '@/components/ui/Text';
import type { FinanceRecord } from '@/types';
import { formatFinanceDate } from '@/utils/doctorFinance';
import { formatSom } from '@/utils/slots';

export function TransactionRow({
  record,
  last,
  onPress,
}: {
  record: FinanceRecord;
  last?: boolean;
  onPress: () => void;
}) {
  const { t, i18n } = useTranslation();
  const { colors, hairline } = useLoginTheme();
  const income = record.type === 'income';
  const amountColor = income ? colors.success : colors.warning;
  const sign = income ? '+' : '−';
  const dateLabel = formatFinanceDate(record.date, i18n.language);
  const method = record.paymentMethod
    ? t(`doctor_finance.method_${record.paymentMethod}`)
    : null;
  const meta = [dateLabel, record.time, method].filter(Boolean).join('  ·  ');
  const androidPad = Platform.OS === 'android' ? { paddingRight: 4 } : null;

  return (
    <ScalePressable
      accessibilityLabel={record.serviceName}
      onPress={onPress}
      style={{
        paddingVertical: 12,
        paddingHorizontal: 4,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: hairline,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        <View
          style={{
            width: 3,
            alignSelf: 'stretch',
            borderRadius: 2,
            backgroundColor: amountColor,
            opacity: 0.7,
            marginTop: 3,
          }}
        />
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={1.05}
              style={{
                flex: 1,
                fontFamily: 'Geologica_600SemiBold',
                fontSize: 14,
                lineHeight: 19,
                letterSpacing: -0.2,
                color: colors.text,
                ...androidPad,
              }}
            >
              {record.type === 'expense' ? record.serviceName : record.serviceName}
            </Text>
            <Text
              maxFontSizeMultiplier={1}
              style={{
                fontFamily: 'Geologica_700Bold',
                fontSize: 14,
                lineHeight: 18,
                color: amountColor,
                ...androidPad,
              }}
            >
              {`${sign}${formatSom(record.amount)}`}
            </Text>
          </View>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: 'GolosText_400Regular',
              fontSize: 12,
              lineHeight: 16,
              color: colors.textSecondary,
            }}
          >
            {record.patientName ?? t('doctor_finance.no_patient')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <Text
              numberOfLines={1}
              style={{
                flex: 1,
                fontFamily: 'GolosText_400Regular',
                fontSize: 11,
                lineHeight: 15,
                color: colors.textMuted,
              }}
            >
              {meta}
            </Text>
            <PaymentStatusBadge status={record.paymentStatus} />
          </View>
        </View>
      </View>
    </ScalePressable>
  );
}
