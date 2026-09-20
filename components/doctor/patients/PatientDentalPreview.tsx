import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { Text } from '@/components/ui/Text';
import type { Patient } from '@/types';
import { problemTeeth } from '@/utils/doctorPatients';

export function PatientDentalPreview({
  patient,
  onOpen,
}: {
  patient: Patient;
  onOpen?: () => void;
}) {
  const { t } = useTranslation();
  const { colors, hairline, authSurface, isDark } = useLoginTheme();
  const teeth = problemTeeth(patient);

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
      <View>
        <Text
          style={{
            fontFamily: 'Geologica_600SemiBold',
            fontSize: 15,
            lineHeight: 20,
            color: colors.text,
          }}
        >
          {t('patients.dental_preview')}
        </Text>
        <Text
          style={{
            fontFamily: 'GolosText_400Regular',
            fontSize: 12,
            lineHeight: 16,
            color: colors.textMuted,
            marginTop: 2,
          }}
        >
          {t('patients.problem_teeth')}
        </Text>
      </View>

      {teeth.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {teeth.map((num) => (
            <View
              key={num}
              style={{
                minWidth: 40,
                height: 36,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isDark ? 'rgba(251,191,36,0.14)' : 'rgba(245,158,11,0.1)',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(251,191,36,0.28)' : 'rgba(245,158,11,0.22)',
              }}
            >
              <Text
                style={{
                  fontFamily: 'Geologica_600SemiBold',
                  fontSize: 14,
                  color: colors.warning,
                }}
              >
                {num}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text
          style={{
            fontFamily: 'GolosText_400Regular',
            fontSize: 13,
            color: colors.textMuted,
          }}
        >
          {t('patients.no_problem_teeth')}
        </Text>
      )}

      <ScalePressable
        accessibilityLabel={t('patients.open_chart')}
        onPress={onOpen}
        style={{
          height: 40,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDark ? 'rgba(129,140,248,0.14)' : 'rgba(67,56,202,0.08)',
        }}
      >
        <Text
          style={{
            fontFamily: 'GolosText_600SemiBold',
            fontSize: 13,
            color: colors.primary,
          }}
        >
          {t('patients.open_chart')}
        </Text>
      </ScalePressable>
    </View>
  );
}
