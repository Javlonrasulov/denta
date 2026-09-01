import { router } from 'expo-router';
import { Search, SlidersHorizontal } from '@/components/icons';
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ClinicCard } from '@/components/clinic/ClinicCard';
import { DoctorCard } from '@/components/doctor/DoctorCard';
import {
  MobileEmpty,
  MobileHeader,
  MobileIconButton,
  MobileSegmented,
} from '@/components/mobile';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/Input';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useClinics, useDoctors } from '@/hooks/queries';
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
        <MobileHeader title={t('search.title')} />
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <SearchInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('map.search_placeholder')}
              onClear={() => setQuery('')}
            />
          </View>
          <MobileIconButton
            accessibilityLabel={t('search.filters')}
            onPress={() => setFiltersOpen(true)}
          >
            <SlidersHorizontal size={18} color={colors.primary} strokeWidth={1.8} />
          </MobileIconButton>
        </View>
        <MobileSegmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'clinics', label: t('favorites.clinics') },
            { value: 'doctors', label: t('favorites.doctors') },
          ]}
        />
      </View>

      {tab === 'clinics' ? (
        clinics.isLoading ? (
          <ListSkeleton rows={5} />
        ) : sortedClinics.length === 0 ? (
          <MobileEmpty icon={Search} title={t('search.no_results')} description={t('empty.no_data')} />
        ) : (
          <FlatList
            data={sortedClinics}
            keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.md, paddingBottom: 120 }}
            renderItem={({ item }) => (
              <ClinicCard clinic={item} onPress={() => router.push(`/(client)/clinic/${item.id}`)} />
            )}
          />
        )
      ) : doctors.isLoading ? (
        <ListSkeleton rows={5} />
      ) : !doctors.data?.length ? (
        <MobileEmpty icon={Search} title={t('search.no_results')} />
      ) : (
        <FlatList
          data={doctors.data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.sm, paddingBottom: spacing['5xl'] }}
          renderItem={({ item }) => (
            <DoctorCard doctor={item} onPress={() => router.push(`/(client)/doctor/${item.id}`)} />
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
            <Text variant="caption" muted>
              {t('search.rating')}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
              {[0, 4, 4.5, 4.8].map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setMinRating(r)}
                  style={{
                    paddingHorizontal: spacing.lg,
                    paddingVertical: 10,
                    borderRadius: radius.full,
                    backgroundColor: minRating === r ? colors.primary : colors.surfaceSoft,
                  }}
                >
                  <Text variant="caption" weight="semibold" color={minRating === r ? colors.textInverse : colors.text}>
                    {r === 0 ? t('search.clear_filters') : `${r}+`}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text variant="caption" muted>
              {t('search.sort')}
            </Text>
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
                    paddingVertical: 10,
                    borderRadius: radius.full,
                    backgroundColor: sort === key ? colors.primaryMuted : colors.surfaceSoft,
                  }}
                >
                  <Text variant="caption" weight="semibold" color={sort === key ? colors.primary : colors.text}>
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
