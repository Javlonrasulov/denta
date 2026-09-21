import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';

import {
  DEFAULT_SEARCH_FILTERS,
  SPEC_KEYS,
  type DistanceBand,
  type ExperienceBand,
  type GenderFilter,
  type PriceBand,
  type SearchFilters,
  type SearchSort,
  type SearchTab,
} from './types';

type Props = {
  visible: boolean;
  tab: SearchTab;
  filters: SearchFilters;
  onClose: () => void;
  onApply: (filters: SearchFilters) => void;
};

function ChipRow<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  const { colors, radius } = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => {
              void Haptics.selectionAsync();
              onChange(opt.value);
            }}
            style={{
              minHeight: 40,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: radius.full,
              backgroundColor: active ? colors.primary : colors.surfaceSoft,
              borderWidth: 1,
              borderColor: active ? colors.primary : 'transparent',
            }}
          >
            <Text variant="caption" weight="semibold" color={active ? colors.textInverse : colors.text}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 10 }}>
      <Text variant="label" color={colors.textSecondary}>
        {title}
      </Text>
      {children}
    </View>
  );
}

export function SearchFilterSheet({ visible, tab, filters, onClose, onApply }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, shadows } = useTheme();
  const [draft, setDraft] = useState<SearchFilters>(filters);

  useEffect(() => {
    if (visible) setDraft(filters);
  }, [visible, filters]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityRole="button" />
        <View
          style={[
            shadows.lg,
            {
              backgroundColor: colors.surface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              maxHeight: '88%',
              paddingHorizontal: 20,
              paddingTop: 10,
              paddingBottom: Math.max(insets.bottom, 16) + 12,
              gap: 16,
            },
          ]}
        >
          <View
            style={{
              alignSelf: 'center',
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.border,
              marginBottom: 4,
            }}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text variant="h2">{t('search.filters')}</Text>
            <Pressable onPress={() => setDraft(DEFAULT_SEARCH_FILTERS)} hitSlop={8}>
              <Text variant="caption" weight="semibold" color={colors.primary}>
                {t('search.clear')}
              </Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 20, paddingBottom: 8 }}>
            <Section title={t('search.specialization')}>
              <ChipRow
                value={(draft.specialization ?? 'any') as string}
                options={[
                  { value: 'any', label: t('search.any') },
                  ...SPEC_KEYS.map((key) => ({ value: key, label: t(`search.specs.${key}`) })),
                ]}
                onChange={(value) => setDraft({ ...draft, specialization: value === 'any' ? null : value })}
              />
            </Section>

            <Section title={t('search.rating')}>
              <ChipRow
                value={String(draft.minRating)}
                options={[
                  { value: '0', label: t('search.any') },
                  { value: '4', label: '4.0+' },
                  { value: '4.5', label: '4.5+' },
                  { value: '4.8', label: '4.8+' },
                ]}
                onChange={(value) => setDraft({ ...draft, minRating: Number(value) })}
              />
            </Section>

            <Section title={t('search.price_range')}>
              <ChipRow<PriceBand>
                value={draft.priceBand}
                options={[
                  { value: 'any', label: t('search.any') },
                  { value: 'lt150', label: t('search.price_lt150') },
                  { value: '150to300', label: t('search.price_150to300') },
                  { value: 'gt300', label: t('search.price_gt300') },
                ]}
                onChange={(value) => setDraft({ ...draft, priceBand: value })}
              />
            </Section>

            {tab === 'doctors' ? (
              <Section title={t('search.experience')}>
                <ChipRow<ExperienceBand>
                  value={draft.experienceBand}
                  options={[
                    { value: 'any', label: t('search.any') },
                    { value: '5', label: t('search.exp_5') },
                    { value: '8', label: t('search.exp_8') },
                    { value: '12', label: t('search.exp_12') },
                  ]}
                  onChange={(value) => setDraft({ ...draft, experienceBand: value })}
                />
              </Section>
            ) : null}

            <Section title={t('search.proximity')}>
              <ChipRow<DistanceBand>
                value={draft.distanceBand}
                options={[
                  { value: 'any', label: t('search.any') },
                  { value: '2', label: t('search.distance_2') },
                  { value: '5', label: t('search.distance_5') },
                  { value: '10', label: t('search.distance_10') },
                ]}
                onChange={(value) => setDraft({ ...draft, distanceBand: value })}
              />
            </Section>

            <Section title={t('search.open_now')}>
              <ChipRow
                value={draft.openNow ? 'yes' : 'no'}
                options={[
                  { value: 'no', label: t('search.any') },
                  { value: 'yes', label: t('search.open_now') },
                ]}
                onChange={(value) => setDraft({ ...draft, openNow: value === 'yes' })}
              />
            </Section>

            {tab === 'doctors' ? (
              <Section title={t('search.gender')}>
                <ChipRow<GenderFilter>
                  value={draft.gender}
                  options={[
                    { value: 'any', label: t('search.any') },
                    { value: 'male', label: t('search.gender_male') },
                    { value: 'female', label: t('search.gender_female') },
                  ]}
                  onChange={(value) => setDraft({ ...draft, gender: value })}
                />
              </Section>
            ) : null}

            <Section title={t('search.sort')}>
              <ChipRow<SearchSort>
                value={draft.sort}
                options={[
                  { value: 'recommended', label: t('search.sort_recommended') },
                  { value: 'rating', label: t('search.sort_rating') },
                  { value: 'price', label: t('search.sort_price') },
                  { value: 'nearest', label: t('search.sort_nearest') },
                  { value: 'popular', label: t('search.sort_popular') },
                ]}
                onChange={(value) => setDraft({ ...draft, sort: value })}
              />
            </Section>
          </ScrollView>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Button title={t('search.clear')} variant="outline" onPress={() => setDraft(DEFAULT_SEARCH_FILTERS)} fullWidth />
            </View>
            <View style={{ flex: 1.4 }}>
              <Button
                title={t('search.apply')}
                onPress={() => {
                  onApply(draft);
                  onClose();
                }}
                fullWidth
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
