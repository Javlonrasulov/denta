import { useMemo } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppShell } from '@/components/layout/AppShell';
import { DataTable, Section } from '@/components/crm';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useDoctors } from '@/hooks/queries';
import { useTheme } from '@/theme';
import { formatPrice } from '@/utils/slots';
import type { Service } from '@/types';

export default function ClinicServicesScreen() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const doctors = useDoctors();

  const services = useMemo(() => {
    const map = new Map<string, Service>();
    for (const d of doctors.data ?? []) {
      for (const s of d.services) map.set(s.id, s);
    }
    return [...map.values()];
  }, [doctors.data]);

  return (
    <AppShell title={t('crm.services.title')} subtitle={t('crm.services.subtitle')}>
      {doctors.isLoading ? (
        <ListSkeleton rows={5} />
      ) : (
        <Section title={t('crm.services.title')} padded={false}>
          <DataTable
            data={services}
            keyExtractor={(s) => s.id}
            columns={[
              {
                key: 'name',
                title: t('crm.services.title'),
                flex: 1.5,
                render: (s) => (
                  <Text variant="bodySmall" weight="semibold">
                    {s.name}
                  </Text>
                ),
              },
              {
                key: 'cat',
                title: t('crm.services.category'),
                render: (s) => (
                  <Text variant="caption" muted>
                    {s.category}
                  </Text>
                ),
              },
              {
                key: 'dur',
                title: t('crm.services.duration'),
                render: (s) => (
                  <Text variant="caption" muted>
                    {s.durationMinutes} {t('common.minutes')}
                  </Text>
                ),
              },
              {
                key: 'price',
                title: t('crm.services.price'),
                render: (s) => (
                  <Text variant="caption" weight="semibold" color={colors.primary}>
                    {formatPrice(s.price)}
                  </Text>
                ),
              },
            ]}
          />
        </Section>
      )}
    </AppShell>
  );
}
