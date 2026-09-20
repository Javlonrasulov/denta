import { Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { Text } from '@/components/ui/Text';
import type { Patient } from '@/types';
import {
  formatNextAppointment,
  formatPatientDate,
  patientHasDebt,
} from '@/utils/doctorPatients';
import { formatSom } from '@/utils/slots';

function Cell({ label, value, tone }: { label: string; value: string; tone?: string }) {
  const { colors } = useLoginTheme();
  return (
    <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
      <Text
        numberOfLines={1}
        maxFontSizeMultiplier={1}
        style={{
          fontFamily: 'GolosText_500Medium',
          fontSize: 10,
          lineHeight: 13,
          color: colors.textMuted,
        }}
      >
        {label}
      </Text>
      <Text
        numberOfLines={1}
        maxFontSizeMultiplier={1.05}
        style={{
          fontFamily: 'Geologica_600SemiBold',
          fontSize: 13,
          lineHeight: 18,
          color: tone ?? colors.text,
          ...(Platform.OS === 'android' ? { paddingRight: 2 } : null),
        }}
      >
        {value}
      </Text>
    </View>
  );
}

export function PatientOverviewStats({ patient }: { patient: Patient }) {
  const { t, i18n } = useTranslation();
  const { colors, hairline, authSurface } = useLoginTheme();
  const next = formatNextAppointment(patient, i18n.language);
  const last = formatPatientDate(patient.lastVisit, i18n.language);
  const debt = patientHasDebt(patient);
  const balance = patient.balance ?? 0;

  return (
    <View
      style={{
        backgroundColor: authSurface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: hairline,
        paddingVertical: 12,
        paddingHorizontal: 14,
        flexDirection: 'row',
        gap: 10,
      }}
    >
      <Cell label={t('patients.stat_visits')} value={String(patient.visitCount ?? 0)} />
      <View style={{ width: 1, backgroundColor: hairline }} />
      <Cell label={t('patients.stat_last')} value={last || '—'} />
      <View style={{ width: 1, backgroundColor: hairline }} />
      <Cell
        label={t('patients.stat_next')}
        value={next ? `${next.date}${next.time ? `, ${next.time}` : ''}` : '—'}
      />
      <View style={{ width: 1, backgroundColor: hairline }} />
      <Cell
        label={t('patients.stat_balance')}
        value={t('patients.som', { amount: formatSom(balance) })}
        tone={debt && balance > 0 ? colors.warning : colors.success}
      />
    </View>
  );
}
