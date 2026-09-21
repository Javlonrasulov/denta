import { Pressable, ScrollView, View } from 'react-native';
import { X } from '@/components/icons';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';

import type { SearchFilters, SearchTab } from './types';
import { specLabel } from './searchUtils';

type Chip = { id: string; label: string; onRemove: () => void };

type Props = {
  count: number;
  tab: SearchTab;
  filters: SearchFilters;
  onChange: (next: SearchFilters) => void;
};

export function SearchResultSummary({ count, tab, filters, onChange }: Props) {
  const { t } = useTranslation();
  const { colors, radius } = useTheme();

  const chips: Chip[] = [];
  if (filters.specialization) {
    chips.push({
      id: 'spec',
      label: specLabel(t, filters.specialization),
      onRemove: () => onChange({ ...filters, specialization: null }),
    });
  }
  if (filters.minRating) {
    chips.push({
      id: 'rating',
      label: `${filters.minRating}+`,
      onRemove: () => onChange({ ...filters, minRating: 0 }),
    });
  }
  if (filters.priceBand !== 'any') {
    chips.push({
      id: 'price',
      label: t(`search.price_${filters.priceBand}`),
      onRemove: () => onChange({ ...filters, priceBand: 'any' }),
    });
  }
  if (filters.distanceBand !== 'any') {
    chips.push({
      id: 'dist',
      label: t(`search.distance_${filters.distanceBand}`),
      onRemove: () => onChange({ ...filters, distanceBand: 'any' }),
    });
  }
  if (filters.openNow) {
    chips.push({
      id: 'open',
      label: t('search.open_now'),
      onRemove: () => onChange({ ...filters, openNow: false }),
    });
  }
  if (tab === 'doctors' && filters.experienceBand !== 'any') {
    chips.push({
      id: 'exp',
      label: t(`search.exp_${filters.experienceBand}`),
      onRemove: () => onChange({ ...filters, experienceBand: 'any' }),
    });
  }
  if (tab === 'doctors' && filters.gender !== 'any') {
    chips.push({
      id: 'gender',
      label: t(`search.gender_${filters.gender}`),
      onRemove: () => onChange({ ...filters, gender: 'any' }),
    });
  }
  if (filters.sort !== 'recommended') {
    chips.push({
      id: 'sort',
      label: t(`search.sort_${filters.sort}`),
      onRemove: () => onChange({ ...filters, sort: 'recommended' }),
    });
  }

  return (
    <View style={{ gap: 10 }}>
      <Text variant="label" color={colors.textSecondary} style={{ fontSize: 13 }}>
        {t('search.results_count', { count })}
      </Text>
      {chips.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {chips.map((chip) => (
            <Pressable
              key={chip.id}
              onPress={chip.onRemove}
              accessibilityRole="button"
              accessibilityLabel={chip.label}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingLeft: 12,
                paddingRight: 8,
                paddingVertical: 7,
                borderRadius: radius.full,
                backgroundColor: colors.primaryMuted,
              }}
            >
              <Text variant="caption" color={colors.primary} weight="semibold" numberOfLines={1}>
                {chip.label}
              </Text>
              <X size={12} color={colors.primary} strokeWidth={2.4} />
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}
