import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppShell } from '@/components/layout/AppShell';
import { MiniBars, Section } from '@/components/crm';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';

export default function ClinicReportsScreen() {
  const { t } = useTranslation();
  const { colors, spacing, isDesktop } = useTheme();

  const cards = [
    { title: t('finance.income'), values: [40, 55, 48, 62, 70, 58, 75] },
    { title: t('tabs.appointments'), values: [20, 28, 22, 30, 35, 32, 40] },
    { title: t('tabs.patients'), values: [8, 12, 10, 15, 14, 18, 16] },
    { title: t('tabs.doctors', { defaultValue: 'Doctors' }), values: [5, 6, 6, 7, 8, 8, 9] },
  ];

  return (
    <AppShell title={t('crm.reports.title')} subtitle={t('crm.reports.subtitle')}>
      <View style={{ gap: spacing.lg }}>
        <View style={{ alignItems: 'flex-end' }}>
          <Button title={t('common.export')} variant="outline" size="sm" onPress={() => undefined} />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
          {cards.map((card) => (
            <View key={card.title} style={{ width: isDesktop ? '48%' : '100%', flexGrow: 1 }}>
              <Section title={card.title}>
                <MiniBars values={card.values} />
                <Text variant="caption" muted style={{ marginTop: spacing.sm }}>
                  {t('crm.dashboard.range_7d')}
                </Text>
              </Section>
            </View>
          ))}
        </View>
      </View>
    </AppShell>
  );
}
