import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from '@/components/icons';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Odontogram } from '@/components/odontogram/Odontogram';
import { useQuery } from '@tanstack/react-query';
import { getPatientOdontogram } from '@/services/patientService';
import { SegmentedControl } from '@/components/crm';
import { ErrorState } from '@/components/states/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { usePatient } from '@/hooks/queries';
import { useTheme } from '@/theme';

type Tab = 'overview' | 'appointments' | 'treatment' | 'chart' | 'payments' | 'notes';

export default function ClinicPatientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius, shadows } = useTheme();
  const patient = usePatient(id);
  const odontogramQuery = useQuery({
    queryKey: ['patients', id, 'odontogram'],
    enabled: Boolean(id),
    queryFn: () => getPatientOdontogram(id),
  });
  const [tab, setTab] = useState<Tab>('overview');

  if (patient.isLoading) return <ListSkeleton rows={6} />;
  if (!patient.data) {
    return (
      <ErrorState
        title={t('error.something_wrong')}
        onRetry={() => patient.refetch()}
        retryLabel={t('common.retry')}
      />
    );
  }

  const p = patient.data;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.md,
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing['5xl'],
        gap: spacing.xl,
      }}
    >
      <Pressable onPress={() => router.back()} hitSlop={8} style={{ width: 44, height: 44, justifyContent: 'center' }}>
        <ArrowLeft size={22} color={colors.text} />
      </Pressable>

      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          padding: spacing.xl,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          ...shadows.sm,
          gap: spacing.lg,
        }}
      >
        <View style={{ flexDirection: 'row', gap: spacing.lg, alignItems: 'center' }}>
          <Avatar name={p.fullName} size={72} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="h1" style={{ fontSize: 22 }}>
              {p.fullName}
            </Text>
            <Text variant="body" muted>
              {p.phone}
            </Text>
            <Text variant="caption" muted>
              {t('crm.patients.patient_id')}: {p.id}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
          {[
            { label: t('crm.patients.visits'), value: '12' },
            { label: t('patients.last_visit'), value: p.lastVisit ?? '—' },
            { label: t('crm.patients.balance'), value: '0' },
            { label: t('crm.patients.next'), value: p.nextAppointment ?? '—' },
          ].map((s) => (
            <View
              key={s.label}
              style={{
                flexGrow: 1,
                minWidth: 120,
                padding: spacing.md,
                borderRadius: radius.md,
                backgroundColor: colors.surfaceSoft,
                gap: 2,
              }}
            >
              <Text variant="caption" muted>
                {s.label}
              </Text>
              <Text variant="label">{s.value}</Text>
            </View>
          ))}
        </View>
      </View>

      <SegmentedControl
        value={tab}
        onChange={setTab}
        options={[
          { value: 'overview', label: t('crm.patients.overview') },
          { value: 'appointments', label: t('tabs.appointments') },
          { value: 'treatment', label: t('crm.patients.treatment_tab') },
          { value: 'chart', label: t('crm.patients.dental_chart') },
          { value: 'payments', label: t('crm.patients.payments') },
          { value: 'notes', label: t('crm.patients.notes') },
        ]}
      />

      {tab === 'chart' ? (
        <Odontogram teeth={odontogramQuery.data ?? []} />
      ) : tab === 'notes' ? (
        <Text variant="body" muted>
          {p.notes ?? t('empty.no_data')}
        </Text>
      ) : (
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            padding: spacing.xl,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
          }}
        >
          <Text variant="body" muted>
            {t('empty.no_data')}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
