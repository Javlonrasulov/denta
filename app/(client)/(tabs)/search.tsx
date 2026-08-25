import { router } from 'expo-router';
import { SlidersHorizontal } from '@/components/icons';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ClinicCard } from '@/components/clinic/ClinicCard';
import { DoctorCard } from '@/components/doctor/DoctorCard';
import { EmptyState } from '@/components/states/EmptyState';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/Input';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useClinics, useDoctors } from '@/hooks/queries';
import { Search } from '@/components/icons';
import { useTheme } from '@/theme';

type SortKey = 'nearest' | 'rating' | 'price';

export default function SearchScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius } = useTheme();
  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState<SortKey>('nearest');
  const [tab, setTab] = useState<'clinics' | 'doctors'>('clinics');

  const clinics = useClinics({ query, minRating: minRating || undefined });
  const doctors = useDoctors({ query });

  const sortedClinics = useMemo(() => {
    const list = [...(clinics.data ?? [])];
    if (sort === 'rating') list.sort((a, b) => b.rating - a.rating);
    else if (sort === 'price') list.sort((a, b) => a.priceFrom - b.priceFrom);
    else list.sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99));
    return list;
  }, [clinics.data, sort]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.md }}>
        <Text variant="h1">{t('search.title')}</Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <SearchInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('search.placeholder')}
              onClear={() => setQuery('')}
            />
          </View>
          <Pressable
            onPress={() => setFiltersOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={t('search.filters')}
            style={{
              width: 52,
              height: 52,
              borderRadius: radius.lg,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SlidersHorizontal size={20} color={colors.textInverse} />
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {(['clinics', 'doctors'] as const).map((key) => (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              style={{
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.sm + 2,
                borderRadius: radius.full,
                backgroundColor: tab === key ? colors.primaryMuted : colors.surface,
                borderWidth: 1,
                borderColor: tab === key ? colors.primary : colors.border,
              }}
            >
              <Text variant="label" color={tab === key ? colors.primary : colors.textSecondary}>
                {key === 'clinics' ? t('favorites.clinics') : t('favorites.doctors')}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {tab === 'clinics' ? (
        clinics.isLoading ? (
          <ListSkeleton rows={5} />
        ) : sortedClinics.length === 0 ? (
          <EmptyState
            icon={Search}
            title={t('search.no_results')}
            description={t('empty.no_data')}
          />
        ) : (
          <FlatList
            data={sortedClinics}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}
            renderItem={({ item }) => (
              <ClinicCard
                clinic={item}
                onPress={() => router.push(`/(client)/clinic/${item.id}`)}
              />
            )}
          />
        )
      ) : doctors.isLoading ? (
        <ListSkeleton rows={5} />
      ) : !doctors.data?.length ? (
        <EmptyState icon={Search} title={t('search.no_results')} />
      ) : (
        <FlatList
          data={doctors.data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}
          renderItem={({ item }) => (
            <DoctorCard
              doctor={item}
              onPress={() => router.push(`/(client)/doctor/${item.id}`)}
            />
          )}
        />
      )}

      <Modal visible={filtersOpen} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay }}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: radius['2xl'],
              borderTopRightRadius: radius['2xl'],
              padding: spacing['2xl'],
              paddingBottom: insets.bottom + spacing.xl,
              gap: spacing.lg,
            }}
          >
            <Text variant="h2">{t('search.filters')}</Text>
            <Text variant="label">{t('search.rating')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
              {[0, 4, 4.5, 4.8].map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setMinRating(r)}
                  style={{
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.sm,
                    borderRadius: radius.full,
                    backgroundColor: minRating === r ? colors.primary : colors.surfaceSoft,
                  }}
                >
                  <Text variant="label" color={minRating === r ? colors.textInverse : colors.text}>
                    {r === 0 ? t('search.clear_filters') : `${r}+`}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text variant="label">{t('search.sort')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {(
                [
                  ['nearest', 'search.nearest'],
                  ['rating', 'search.highest_rated'],
                  ['price', 'search.price_low'],
                ] as const
              ).map(([key, label]) => (
                <Pressable
                  key={key}
                  onPress={() => setSort(key)}
                  style={{
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.sm,
                    borderRadius: radius.full,
                    backgroundColor: sort === key ? colors.secondaryMuted : colors.surfaceSoft,
                  }}
                >
                  <Text variant="label" color={sort === key ? colors.secondary : colors.text}>
                    {t(label)}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Button title={t('search.apply_filters')} onPress={() => setFiltersOpen(false)} fullWidth />
          </View>
        </View>
      </Modal>
    </View>
  );
}
