import { Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { Text } from '@/components/ui/Text';
import type { PatientSummaryStats } from '@/utils/doctorPatients';

function Cell({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone?: string;
}) {
  const { colors } = useLoginTheme();
  const androidPad = Platform.OS === 'android' ? { paddingRight: 2 } : null;

  return (
    <View style={{ flex: 1, minWidth: 0, alignItems: 'center', gap: 2 }}>
      <Text
        maxFontSizeMultiplier={1}
        numberOfLines={1}
        style={{
          fontFamily: 'Geologica_700Bold',
          fontSize: 16,
          lineHeight: 20,
          letterSpacing: -0.3,
          color: tone ?? colors.text,
          ...androidPad,
        }}
      >
        {value}
      </Text>
      <Text
        maxFontSizeMultiplier={1}
        numberOfLines={1}
        style={{
          fontFamily: 'GolosText_500Medium',
          fontSize: 10,
          lineHeight: 13,
          letterSpacing: 0.2,
          color: colors.textMuted,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export function PatientSummary({ stats }: { stats: PatientSummaryStats }) {
  const { t } = useTranslation();
  const { colors, hairline, authSurface } = useLoginTheme();

  return (
    <Animated.View
      entering={FadeInDown.duration(240).delay(40)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: authSurface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: hairline,
        paddingVertical: 10,
        paddingHorizontal: 6,
      }}
    >
      <Cell label={t('patients.title')} value={stats.total} tone={colors.primary} />
      <View style={{ width: 1, height: 28, backgroundColor: hairline }} />
      <Cell label={t('patients.summary_today')} value={stats.today} />
      <View style={{ width: 1, height: 28, backgroundColor: hairline }} />
      <Cell label={t('patients.summary_treatment')} value={stats.treatment} />
      <View style={{ width: 1, height: 28, backgroundColor: hairline }} />
      <Cell
        label={t('patients.summary_debt')}
        value={stats.debt}
        tone={stats.debt > 0 ? colors.warning : undefined}
      />
    </Animated.View>
  );
}
