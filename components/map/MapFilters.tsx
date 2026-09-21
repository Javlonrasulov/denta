import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

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
  const { colors, isDark } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      nestedScrollEnabled
      bounces
      alwaysBounceHorizontal
      decelerationRate="fast"
      contentContainerStyle={styles.content}
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
              {
                backgroundColor: isOn
                  ? colors.primary
                  : isDark
                    ? 'rgba(15,23,42,0.78)'
                    : '#FFFFFF',
                borderColor: isOn
                  ? colors.primary
                  : isDark
                    ? 'rgba(255,255,255,0.12)'
                    : 'rgba(15,23,42,0.08)',
              },
            ]}
          >
            <RNText
              numberOfLines={1}
              style={{
                color: isOn ? '#FFFFFF' : colors.text,
                fontSize: 13,
                lineHeight: 16,
                fontWeight: '600',
                includeFontPadding: false,
                fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : undefined,
              }}
            >
              {t(LABEL_KEYS[id])}
            </RNText>
          </Pressable>
        );
      })}
      <View style={{ width: 8 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexGrow: 0, marginTop: 0 },
  content: {
    paddingLeft: 16,
    paddingRight: 24,
    gap: 8,
    alignItems: 'center',
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});
