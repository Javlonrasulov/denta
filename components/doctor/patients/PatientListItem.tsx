import { Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { PatientAvatar } from '@/components/doctor/patients/PatientAvatar';
import { PatientStatusBadge } from '@/components/doctor/patients/PatientStatusBadge';
import { ChevronRight } from '@/components/icons';
import { Text } from '@/components/ui/Text';
import type { Patient } from '@/types';
import {
  formatNextAppointment,
  formatPatientDate,
  formatPatientPhone,
  patientClinicalStatus,
  patientFullName,
  patientHasDebt,
} from '@/utils/doctorPatients';
import { formatSom } from '@/utils/slots';

export function PatientListItem({
  patient,
  onPress,
}: {
  patient: Patient;
  index?: number;
  onPress: () => void;
}) {
  const { t, i18n } = useTranslation();
  const { colors, hairline, authSurface } = useLoginTheme();
  const name = patientFullName(patient);
  const status = patientClinicalStatus(patient);
  const next = formatNextAppointment(patient, i18n.language);
  const last = formatPatientDate(patient.lastVisit, i18n.language);
  const debt = patientHasDebt(patient);
  const serviceLabel = patient.currentServiceKey ? t(patient.currentServiceKey) : null;
  const androidPad = Platform.OS === 'android' ? { paddingRight: 6 } : null;
  const lastPart = last ? `${t('patients.last_visit')}: ${last}` : null;
  const nextPart = next
    ? `${t('patients.next_short')}: ${next.date}${next.time ? `, ${next.time}` : ''}`
    : t('patients.next_unscheduled');
  const meta = [lastPart, nextPart].filter(Boolean).join('  ·  ');

  return (
    <ScalePressable
      accessibilityLabel={name}
      onPress={onPress}
      style={{
        backgroundColor: authSurface,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: hairline,
        paddingVertical: 12,
        paddingLeft: 12,
        paddingRight: 10,
      }}
    >
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <PatientAvatar name={name} uri={patient.avatar} size={46} />
        <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={1.05}
              style={{
                flex: 1,
                fontFamily: 'Geologica_600SemiBold',
                fontSize: 15,
                lineHeight: 20,
                letterSpacing: -0.2,
                color: colors.text,
                ...androidPad,
              }}
            >
              {name}
            </Text>
            <ChevronRight size={16} color={colors.textMuted} strokeWidth={1.8} />
          </View>
          <Text
            numberOfLines={1}
            maxFontSizeMultiplier={1.05}
            style={{
              fontFamily: 'GolosText_400Regular',
              fontSize: 12,
              lineHeight: 16,
              color: colors.textSecondary,
            }}
          >
            {formatPatientPhone(patient.phone)}
          </Text>
          <Text
            numberOfLines={1}
            maxFontSizeMultiplier={1.05}
            style={{
              fontFamily: 'GolosText_400Regular',
              fontSize: 12,
              lineHeight: 16,
              color: colors.textMuted,
            }}
          >
            {meta}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            {serviceLabel ? <PatientStatusBadge kind="service" label={serviceLabel} /> : null}
            <PatientStatusBadge kind={status} />
            {debt && (patient.balance ?? 0) > 0 ? (
              <Text
                maxFontSizeMultiplier={1}
                style={{
                  fontFamily: 'GolosText_600SemiBold',
                  fontSize: 11,
                  lineHeight: 14,
                  color: colors.warning,
                }}
              >
                {t('patients.som', { amount: formatSom(patient.balance ?? 0) })}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </ScalePressable>
  );
}
