import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { PatientStatusBadge } from '@/components/doctor/patients/PatientStatusBadge';
import { Text } from '@/components/ui/Text';
import type { Patient, PatientTreatment } from '@/types';
import { formatPatientDate, patientTreatments } from '@/utils/doctorPatients';

function TreatmentRow({
  item,
  last,
}: {
  item: PatientTreatment;
  last: boolean;
}) {
  const { t, i18n } = useTranslation();
  const { colors, hairline, isDark } = useLoginTheme();
  const title = item.titleKey ? t(item.titleKey) : item.title ?? '';
  const meta = [item.doctorName, item.tooth ? t('patients.tooth_n', { number: item.tooth }) : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={{ flexDirection: 'row', gap: 12, minHeight: 64 }}>
      <View style={{ width: 64, paddingTop: 2 }}>
        <Text
          style={{
            fontFamily: 'Geologica_600SemiBold',
            fontSize: 12,
            lineHeight: 16,
            color: colors.primary,
          }}
        >
          {formatPatientDate(item.date, i18n.language)}
        </Text>
      </View>
      <View style={{ alignItems: 'center', width: 14 }}>
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            marginTop: 4,
            backgroundColor: colors.primary,
            borderWidth: 2,
            borderColor: isDark ? 'rgba(129,140,248,0.35)' : 'rgba(67,56,202,0.18)',
          }}
        />
        {!last ? (
          <View style={{ flex: 1, width: 1.5, backgroundColor: hairline, marginVertical: 4 }} />
        ) : null}
      </View>
      <View style={{ flex: 1, paddingBottom: 16, gap: 4, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              fontFamily: 'GolosText_600SemiBold',
              fontSize: 14,
              lineHeight: 20,
              color: colors.text,
            }}
          >
            {title}
          </Text>
          <PatientStatusBadge kind={item.status} treatment />
        </View>
        {meta ? (
          <Text
            numberOfLines={1}
            style={{
              fontFamily: 'GolosText_400Regular',
              fontSize: 12,
              lineHeight: 16,
              color: colors.textMuted,
            }}
          >
            {meta}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function PatientTreatmentTimeline({
  patient,
  limit,
}: {
  patient: Patient;
  limit?: number;
}) {
  const { t } = useTranslation();
  const { colors } = useLoginTheme();
  const items = patientTreatments(patient).slice(0, limit ?? 20);

  if (!items.length) {
    return (
      <Text
        style={{
          fontFamily: 'GolosText_400Regular',
          fontSize: 14,
          color: colors.textMuted,
        }}
      >
        {t('patients.no_treatments')}
      </Text>
    );
  }

  return (
    <View>
      {items.map((item, index) => (
        <TreatmentRow key={item.id} item={item} last={index === items.length - 1} />
      ))}
    </View>
  );
}
