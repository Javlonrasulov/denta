import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';
import type { MapFilterId } from './mapUtils';
import { MAP_FILTER_IDS } from './mapUtils';

type Props = {
  active: MapFilterId[];
  onToggle: (id: MapFilterId) => void;
};

const LABEL_KEYS: Record<MapFilterId, string> = {
  nearby: 'map.filter_nearby',
  available_today: 'map.filter_available_today',
  rating_45: 'map.filter_rating',
  open_24: 'map.filter_24h',
  price: 'map.filter_price',
  specialty: 'map.filter_specialty',
};

export function MapFilters({ active, onToggle }: Props) {
  const { t } = useTranslation();
  const { colors, spacing, radius, shadows } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
      }}
      style={styles.row}
    >
      {MAP_FILTER_IDS.map((id) => {
        const isOn = active.includes(id);
        return (
          <Pressable
            key={id}
            accessibilityRole="button"
            onPress={() => {
              void Haptics.selectionAsync();
              onToggle(id);
            }}
            style={[
              styles.chip,
              shadows.sm,
              {
                backgroundColor: isOn ? colors.primary : colors.surface,
                borderColor: isOn ? colors.primary : colors.borderSubtle,
                borderRadius: radius.full,
              },
            ]}
          >
            <Text
              variant="caption"
              style={{
                color: isOn ? colors.textInverse : colors.text,
                fontWeight: '600',
              }}
            >
              {t(LABEL_KEYS[id])}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexGrow: 0 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: 'center',
  },
});
