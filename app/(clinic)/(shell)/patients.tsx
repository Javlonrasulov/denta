import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppShell } from '@/components/layout/AppShell';
import { DataTable, Section } from '@/components/crm';
import { Avatar } from '@/components/ui/Avatar';
import { SearchInput } from '@/components/ui/Input';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { usePatients } from '@/hooks/queries';
import { useTheme } from '@/theme';

export default function ClinicPatientsScreen() {
  const { t } = useTranslation();
  const { colors, spacing, isMobile } = useTheme();
  const [query, setQuery] = useState('');
  const patients = usePatients(query);

  return (
    <AppShell title={t('crm.patients.title')} subtitle={t('crm.patients.subtitle')}>
      <View style={{ gap: spacing.lg }}>
        <View
          style={{
            flexDirection: isMobile ? 'column' : 'row',
            gap: spacing.md,
            alignItems: isMobile ? 'stretch' : 'center',
          }}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <SearchInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('patients.search')}
              onClear={() => setQuery('')}
            />
          </View>
          <Button title={t('patients.add_patient')} size="sm" onPress={() => undefined} />
        </View>

        {patients.isLoading ? (
          <ListSkeleton rows={6} />
        ) : (
          <Section title={t('crm.patients.title')} padded={false}>
            <DataTable
              data={patients.data ?? []}
              keyExtractor={(p) => p.id}
              onRowPress={(p) => router.push(`/(clinic)/patient/${p.id}` as never)}
              columns={[
                {
                  key: 'patient',
                  title: t('crm.patients.patient'),
                  flex: 1.5,
                  render: (p) => (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Avatar name={p.fullName} size={32} />
                      <Text variant="bodySmall" weight="semibold">
                        {p.fullName}
                      </Text>
                    </View>
                  ),
                },
                {
                  key: 'phone',
                  title: t('crm.patients.phone'),
                  render: (p) => (
                    <Text variant="caption" muted>
                      {p.phone}
                    </Text>
                  ),
                },
                {
                  key: 'last',
                  title: t('patients.last_visit'),
                  render: (p) => (
                    <Text variant="caption" muted>
                      {p.lastVisit ?? '—'}
                    </Text>
                  ),
                },
                {
                  key: 'next',
                  title: t('patients.next_appointment'),
                  render: (p) => (
                    <Text variant="caption" muted>
                      {p.nextAppointment ?? '—'}
                    </Text>
                  ),
                },
                {
                  key: 'status',
                  title: t('crm.patients.status'),
                  render: (p) => (
                    <Text
                      variant="caption"
                      weight="semibold"
                      color={p.status === 'active' ? colors.success : colors.textMuted}
                    >
                      {p.status === 'active' ? t('patients.status_active') : t('patients.status_inactive')}
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
