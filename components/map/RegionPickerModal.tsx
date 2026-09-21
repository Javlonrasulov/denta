import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { Check } from '@/components/icons';
import { useTheme } from '@/theme';
import { UZ_REGIONS, type UzRegionId } from './uzRegions';

type Props = {
  visible: boolean;
  selectedId: UzRegionId;
  onSelect: (id: UzRegionId) => void;
  onClose: () => void;
};

/** Absolute overlay (not RN Modal) — works reliably above map + bottom sheet. */
export function RegionPickerModal({
  visible,
  selectedId,
  onSelect,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  if (!visible) return null;

  return (
    <View style={styles.root} pointerEvents="box-none">
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" />
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.surface,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
        <RNText
          style={{
            fontSize: 17,
            fontWeight: '700',
            color: colors.text,
            paddingHorizontal: 20,
            marginBottom: 4,
            includeFontPadding: false,
          }}
        >
          {t('map.select_region')}
        </RNText>
        <RNText
          style={{
            fontSize: 13,
            color: colors.textMuted,
            paddingHorizontal: 20,
            marginBottom: 12,
            includeFontPadding: false,
          }}
        >
          {t('map.select_region_hint')}
        </RNText>

        <ScrollView
          style={{ maxHeight: 420 }}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {UZ_REGIONS.map((region) => {
            const active = region.id === selectedId;
            return (
              <Pressable
                key={region.id}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  void Haptics.selectionAsync();
                  onSelect(region.id);
                }}
                style={[
                  styles.row,
                  {
                    backgroundColor: active
                      ? isDark
                        ? 'rgba(0,79,200,0.22)'
                        : 'rgba(0,79,200,0.08)'
                      : 'transparent',
                    borderColor: active
                      ? colors.primary
                      : isDark
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(15,23,42,0.06)',
                  },
                ]}
              >
                <RNText
                  numberOfLines={1}
                  style={{
                    flex: 1,
                    fontSize: 15,
                    fontWeight: active ? '700' : '600',
                    color: colors.text,
                    includeFontPadding: false,
                    fontFamily:
                      Platform.OS === 'android' ? 'sans-serif-medium' : undefined,
                  }}
                >
                  {t(region.labelKey)}
                </RNText>
                {active ? <Check size={18} color={colors.primary} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.45)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    maxHeight: '78%',
    zIndex: 41,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
});
