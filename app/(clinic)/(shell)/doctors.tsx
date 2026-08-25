import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppShell } from '@/components/layout/AppShell';
import { DataTable, Section } from '@/components/crm';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useDoctors } from '@/hooks/queries';
import { useTheme } from '@/theme';
import { formatPrice } from '@/utils/slots';

export default function ClinicDoctorsScreen() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const doctors = useDoctors();

  return (
    <AppShell title={t('crm.doctors.title')} subtitle={t('crm.doctors.subtitle')}>
      <View style={{ gap: spacing.lg }}>
        <View style={{ alignItems: 'flex-end' }}>
          <Button title={t('clinic_crm.add_doctor')} size="sm" onPress={() => undefined} />
        </View>
        {doctors.isLoading ? (
          <ListSkeleton rows={6} />
        ) : (
          <Section title={t('crm.doctors.title')} padded={false}>
            <DataTable
              data={doctors.data ?? []}
              keyExtractor={(d) => d.id}
              onRowPress={(d) => router.push(`/(clinic)/doctor/${d.id}` as never)}
              columns={[
                {
                  key: 'doc',
                  title: t('crm.doctors.title'),
                  flex: 1.6,
                  render: (d) => (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Avatar uri={d.photoUrl} name={d.fullName} size={36} />
                      <View>
                        <Text variant="bodySmall" weight="semibold">
                          {d.fullName}
                        </Text>
                        <Text variant="caption" muted>
                          {d.specialization}
                        </Text>
                      </View>
                    </View>
                  ),
                },
                {
                  key: 'rating',
                  title: t('crm.doctors.rating'),
                  render: (d) => (
                    <Text variant="caption" weight="semibold">
                      {d.rating.toFixed(1)}
                    </Text>
                  ),
                },
                {
                  key: 'rev',
                  title: t('crm.doctors.revenue'),
                  render: (d) => (
                    <Text variant="caption" color={colors.primary} weight="semibold">
                      {formatPrice(d.priceFrom)}
                    </Text>
                  ),
                },
                {
                  key: 'status',
                  title: t('crm.doctors.status'),
                  render: () => (
                    <Text variant="caption" color={colors.success} weight="semibold">
                      {t('patients.status_active')}
                    </Text>
                  ),
                },
              ]}
            />
          </Section>
        )}
      </View>
    </AppShell>
  );
}
