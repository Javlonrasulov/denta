import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { Text } from '@/components/ui/Text';
import type { Patient } from '@/types';
import { formatPatientDate, patientHasDebt, patientPayments } from '@/utils/doctorPatients';
import { formatSom } from '@/utils/slots';

export function PatientPaymentSummary({
  patient,
  onAdd,
  compact,
}: {
  patient: Patient;
  onAdd?: () => void;
  compact?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const { colors, hairline, authSurface, isDark } = useLoginTheme();
  const debt = patientHasDebt(patient) && (patient.balance ?? 0) > 0;
  const payments = patientPayments(patient);

  return (
    <View
      style={{
        backgroundColor: authSurface,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: hairline,
        padding: 14,
        gap: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text
            style={{
              fontFamily: 'GolosText_500Medium',
              fontSize: 12,
              color: colors.textMuted,
            }}
          >
            {debt ? t('patients.debt_title') : t('patients.stat_balance')}
          </Text>
          <Text
            style={{
              fontFamily: 'Geologica_700Bold',
              fontSize: 22,
              lineHeight: 28,
              letterSpacing: -0.4,
              color: debt ? colors.warning : colors.success,
            }}
          >
            {debt
              ? t('patients.som', { amount: formatSom(patient.balance ?? 0) })
              : t('patients.balance_clear')}
          </Text>
        </View>
        {debt ? (
          <ScalePressable
            accessibilityLabel={t('patients.add_payment')}
            onPress={onAdd}
            style={{
              height: 36,
              paddingHorizontal: 12,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isDark ? 'rgba(251,191,36,0.16)' : 'rgba(245,158,11,0.12)',
            }}
          >
            <Text
              style={{
                fontFamily: 'GolosText_600SemiBold',
                fontSize: 12,
                color: colors.warning,
              }}
            >
              {t('patients.add_payment')}
            </Text>
          </ScalePressable>
        ) : null}
      </View>

      {!compact && payments.length ? (
        <View style={{ gap: 10, paddingTop: 4, borderTopWidth: 1, borderTopColor: hairline }}>
          {payments.slice(0, 4).map((pay) => (
            <View key={pay.id} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
              <Text
                style={{
                  fontFamily: 'GolosText_400Regular',
                  fontSize: 13,
                  color: colors.textSecondary,
                }}
              >
                {formatPatientDate(pay.date, i18n.language)}
              </Text>
              <Text
                style={{
                  fontFamily: 'GolosText_600SemiBold',
                  fontSize: 13,
                  color: colors.text,
                }}
              >
                {t('patients.som', { amount: formatSom(pay.amount) })}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {!compact && !payments.length ? (
        <Text
          style={{
            fontFamily: 'GolosText_400Regular',
            fontSize: 13,
            color: colors.textMuted,
          }}
        >
          {t('patients.no_payments')}
        </Text>
      ) : null}
    </View>
  );
}
