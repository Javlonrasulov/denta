import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Keyboard, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import {
  DEFAULT_SEARCH_FILTERS,
  SearchBar,
  SearchClinicCard,
  SearchDoctorCard,
  SearchEmpty,
  SearchError,
  SearchFilterSheet,
  SearchResultSummary,
  SearchSegmented,
  SearchSkeleton,
  type SearchFilters,
  type SearchTab,
} from '@/components/client/search';
import {
  countActiveFilters,
  filterClinics,
  filterDoctors,
  hasNonDefaultFilters,
} from '@/components/client/search/searchUtils';
import { tabBarBottomInset } from '@/components/mobile';
import { Text } from '@/components/ui/Text';
import { useClinics, useDoctors } from '@/hooks/queries';
import { useAppointmentsStore } from '@/store/appointmentsStore';
import { useTheme } from '@/theme';
import type { Clinic, Doctor } from '@/types';

export default function SearchScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, spacing } = useTheme();
  const setDraft = useAppointmentsStore((s) => s.setDraft);

  const params = useLocalSearchParams<{ tab?: string }>();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [tab, setTab] = useState<SearchTab>(params.tab === 'doctors' ? 'doctors' : 'clinics');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_SEARCH_FILTERS);

  useEffect(() => {
    if (params.tab === 'doctors' || params.tab === 'clinics') setTab(params.tab);
  }, [params.tab]);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query.trim()), 220);
    return () => clearTimeout(id);
  }, [query]);

  const clinicsQuery = useClinics();
  const doctorsQuery = useDoctors();

  const clinicsById = useMemo(() => {
    const map = new Map<string, Clinic>();
    for (const clinic of clinicsQuery.data ?? []) map.set(clinic.id, clinic);
    return map;
  }, [clinicsQuery.data]);

  const clinics = useMemo(
    () => filterClinics(clinicsQuery.data ?? [], debouncedQuery, filters),
    [clinicsQuery.data, debouncedQuery, filters],
  );

  const doctors = useMemo(
    () => filterDoctors(doctorsQuery.data ?? [], clinicsById, debouncedQuery, filters),
    [doctorsQuery.data, clinicsById, debouncedQuery, filters],
  );

  const activeCount = countActiveFilters(filters, tab);
  const canClear = hasNonDefaultFilters(filters) || query.length > 0;
  const listPad = 40 + 64 + tabBarBottomInset(insets.bottom);

  const openClinic = (id: string) => router.push(`/(client)/clinic/${id}`);
  const openDoctor = (id: string) => router.push(`/(client)/doctor/${id}`);
  const bookClinic = (clinic: Clinic) => {
    setDraft({ clinicId: clinic.id });
    router.push({ pathname: '/(client)/booking', params: { clinicId: clinic.id } });
  };
  const bookDoctor = (doctor: Doctor) => {
    setDraft({ clinicId: doctor.clinicId, doctorId: doctor.id });
    router.push(`/(client)/doctor/${doctor.id}`);
  };

  const clearAll = () => {
    setQuery('');
    setFilters(DEFAULT_SEARCH_FILTERS);
  };

  const isLoading = tab === 'clinics' ? clinicsQuery.isLoading : doctorsQuery.isLoading;
  const isError = tab === 'clinics' ? clinicsQuery.isError : doctorsQuery.isError;
  const retry = () => {
    void clinicsQuery.refetch();
    void doctorsQuery.refetch();
  };

  const resultCount = tab === 'clinics' ? clinics.length : doctors.length;

  const listHeader = (
    <View style={{ paddingTop: spacing.md, paddingBottom: spacing.md, gap: 14 }}>
      <View style={{ gap: 4 }}>
        <Text variant="h1" style={{ fontSize: 28, lineHeight: 34, letterSpacing: -0.5 }}>
          {t('search.title')}
        </Text>
        <Text variant="bodySmall" color={colors.textSecondary}>
          {t('search.subtitle')}
        </Text>
      </View>

      <SearchBar
        value={query}
        onChangeText={setQuery}
        onClear={() => setQuery('')}
        onOpenFilters={() => {
          Keyboard.dismiss();
          setFiltersOpen(true);
        }}
        filterCount={activeCount}
      />

      <SearchSegmented value={tab} onChange={setTab} />

      {!isLoading && !isError ? (
        <SearchResultSummary
          count={resultCount}
          tab={tab}
          filters={filters}
          onChange={setFilters}
        />
      ) : null}
    </View>
  );

  const listEmpty = isError ? (
    <SearchError onRetry={retry} />
  ) : isLoading ? (
    <SearchSkeleton tab={tab} />
  ) : (
    <SearchEmpty onClear={clearAll} canClear={canClear} />
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      {tab === 'clinics' ? (
        <FlatList
          data={isLoading || isError ? [] : clinics}
          keyExtractor={(item) => item.id}
          key="search-clinics"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            gap: 14,
            paddingBottom: listPad,
            flexGrow: 1,
          }}
          renderItem={({ item }) => (
            <SearchClinicCard
              clinic={item}
              onPress={() => openClinic(item.id)}
              onDetails={() => openClinic(item.id)}
              onBook={() => bookClinic(item)}
            />
          )}
        />
      ) : (
        <FlatList
          data={isLoading || isError ? [] : doctors}
          keyExtractor={(item) => item.id}
          key="search-doctors"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            gap: 12,
            paddingBottom: listPad,
            flexGrow: 1,
          }}
          renderItem={({ item }) => (
            <SearchDoctorCard
              doctor={item}
              clinic={clinicsById.get(item.clinicId)}
              onPress={() => openDoctor(item.id)}
              onView={() => openDoctor(item.id)}
              onBook={() => bookDoctor(item)}
            />
          )}
        />
      )}

      <SearchFilterSheet
        visible={filtersOpen}
        tab={tab}
        filters={filters}
        onClose={() => setFiltersOpen(false)}
        onApply={setFilters}
      />
    </View>
  );
}
