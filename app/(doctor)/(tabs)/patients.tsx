import { useEffect, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useLoginTheme } from '@/components/auth/loginTheme';
import {
  AddPatientSheet,
  PatientEmpty,
  PatientFilters,
  PatientListItem,
  PatientSearch,
  PatientSortSheet,
  PatientSummary,
  PatientsHeader,
  PatientsSkeleton,
} from '@/components/doctor/patients';
import { ErrorState } from '@/components/states/EmptyState';
import { queryKeys, usePatients } from '@/hooks/queries';
import { createPatient } from '@/services/patientService';
import { useToastStore } from '@/store/toastStore';
import type { CreatePatientInput } from '@/types';
import { queryPatients, summarizePatients, type PatientFilter, type PatientSort } from '@/utils/doctorPatients';

export default function DoctorPatientsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { canvas } = useLoginTheme();
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.showToast);
  const patients = usePatients();

  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [filter, setFilter] = useState<PatientFilter>('all');
  const [sort, setSort] = useState<PatientSort>('last_visit');
  const [sortOpen, setSortOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 180);
    return () => clearTimeout(id);
  }, [query]);

  const roster = patients.data ?? [];
  const stats = useMemo(() => summarizePatients(roster), [roster]);
  const visible = useMemo(
    () => queryPatients(roster, debounced, filter, sort),
    [roster, debounced, filter, sort],
  );

  const onAdd = async (input: CreatePatientInput) => {
    const created = await createPatient(input);
    await queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
    showToast({
      tone: 'success',
      title: t('patients.add_success'),
      message: t('patients.add_success_msg', { name: created.fullName }),
    });
  };

  if (patients.isLoading) return <PatientsSkeleton />;
  if (patients.isError) {
    return (
      <ErrorState
        title={t('error.something_wrong')}
        onRetry={() => patients.refetch()}
        retryLabel={t('common.retry')}
      />
    );
  }

  const isFiltered = Boolean(debounced.trim()) || filter !== 'all';

  return (
    <View style={{ flex: 1, backgroundColor: canvas }}>
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 8,
          paddingBottom: 40,
          gap: 10,
          flexGrow: 1,
        }}
        ListHeaderComponent={
          <View style={{ gap: 14, paddingBottom: 6 }}>
            <PatientsHeader
              count={stats.total}
              onFilter={() => setSortOpen(true)}
              onAdd={() => setAddOpen(true)}
            />
            <PatientSummary stats={stats} />
            <PatientSearch value={query} onChangeText={setQuery} onClear={() => setQuery('')} />
            <PatientFilters value={filter} onChange={setFilter} />
          </View>
        }
        ListEmptyComponent={
          <PatientEmpty filtered={isFiltered} onAdd={() => setAddOpen(true)} />
        }
        renderItem={({ item, index }) => (
          <PatientListItem
            patient={item}
            index={index}
            onPress={() => router.push(`/(doctor)/patient/${item.id}`)}
          />
        )}
      />

      <PatientSortSheet
        visible={sortOpen}
        value={sort}
        onClose={() => setSortOpen(false)}
        onChange={setSort}
      />
      <AddPatientSheet visible={addOpen} onClose={() => setAddOpen(false)} onSave={onAdd} />
    </View>
  );
}
