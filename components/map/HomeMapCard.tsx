import { Platform, Pressable, StyleSheet, Text as RNText, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { ChevronRight, Maximize2 } from '@/components/icons';
import { OsmTileMap } from './OsmTileMap';
import { useTheme } from '@/theme';
import type { Clinic } from '@/types';

type MapType = 'standard' | 'satellite';

type Props = {
  clinics: Clinic[];
  openCount: number;
  mapType: MapType;
  onMapTypeChange: (type: MapType) => void;
  onOpenFullMap: () => void;
  onSelectClinic: (id: string) => void;
  onMapInteractionStart?: () => void;
  onMapInteractionEnd?: () => void;
};

/**
 * Home mini-map — compact preview matching fullscreen map chrome language.
 */
export function HomeMapCard({
  clinics,
  openCount,
  mapType,
  onMapTypeChange,
  onOpenFullMap,
  onSelectClinic,
  onMapInteractionStart,
  onMapInteractionEnd,
}: Props) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();

  const surface = {
    backgroundColor: isDark ? 'rgba(15,23,42,0.88)' : 'rgba(255,255,255,0.96)',
    borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.08)',
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)',
        },
      ]}
    >
      <View style={styles.mapFrame}>
        <View
          style={styles.mapTouch}
          onTouchStart={onMapInteractionStart}
          onTouchEnd={onMapInteractionEnd}
          onTouchCancel={onMapInteractionEnd}
        >
          <OsmTileMap
            clinics={clinics}
            satellite={mapType === 'satellite'}
            onPressMap={onOpenFullMap}
            onSelectClinic={onSelectClinic}
          />
        </View>

        {/* Top floating chrome — same language as fullscreen map */}
        <View pointerEvents="box-none" style={styles.topChrome}>
          <View style={[styles.titleCard, surface]}>
            <RNText
              numberOfLines={1}
              style={{
                fontSize: 14,
                lineHeight: 18,
                fontWeight: '700',
                color: colors.text,
                includeFontPadding: false,
                fontFamily:
                  Platform.OS === 'android' ? 'sans-serif-medium' : undefined,
              }}
            >
              {t('home.clinics_map')}
            </RNText>
            <RNText
              numberOfLines={1}
              style={{
                marginTop: 2,
                fontSize: 11,
                lineHeight: 14,
                fontWeight: '500',
                color: colors.textMuted,
                includeFontPadding: false,
              }}
            >
              {t('home.map_subtitle')}
            </RNText>
          </View>

          {openCount > 0 ? (
            <View style={[styles.openChip, surface]}>
              <View style={[styles.openDot, { backgroundColor: colors.success }]} />
              <RNText
                style={{
                  fontSize: 12,
                  lineHeight: 15,
                  fontWeight: '700',
                  color: colors.text,
                  includeFontPadding: false,
                }}
              >
                {t('home.open_now_short', { count: openCount })}
              </RNText>
            </View>
          ) : null}

          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onOpenFullMap();
            }}
            accessibilityRole="button"
            accessibilityLabel={t('home.map_cta')}
            style={[styles.expandBtn, surface]}
          >
            <Maximize2 size={16} color={colors.primary} strokeWidth={2.2} />
          </Pressable>
        </View>

        {/* Bottom-left: Map / Satellite segmented */}
        <View style={[styles.segment, surface]}>
          {(['standard', 'satellite'] as const).map((type) => {
            const active = mapType === type;
            return (
              <Pressable
                key={type}
                onPress={() => onMapTypeChange(type)}
                style={[
                  styles.segmentItem,
                  active ? { backgroundColor: colors.primary } : null,
                ]}
              >
                <RNText
                  style={{
                    fontSize: 12,
                    lineHeight: 16,
                    fontWeight: '700',
                    color: active ? '#FFFFFF' : colors.textMuted,
                    includeFontPadding: false,
                    fontFamily:
                      Platform.OS === 'android' ? 'sans-serif-medium' : undefined,
                  }}
                >
                  {type === 'standard' ? t('home.map_view') : t('home.satellite')}
                </RNText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Footer: legend + CTA */}
      <View style={[styles.footer, { borderTopColor: colors.borderSubtle }]}>
        <View style={styles.legendRow}>
          {[
            { color: colors.primary, label: t('home.legend_clinics') },
            { color: colors.secondary, label: t('home.legend_open') },
            { color: '#64748B', label: t('home.legend_closed') },
          ].map((item) => (
            <View
              key={item.label}
              style={[styles.legendChip, { backgroundColor: colors.surfaceSoft }]}
            >
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <RNText
                style={{
                  fontSize: 11,
                  lineHeight: 14,
                  fontWeight: '600',
                  color: colors.textSecondary,
                  includeFontPadding: false,
                }}
              >
                {item.label}
              </RNText>
            </View>
          ))}
        </View>

        <Pressable
          onPress={onOpenFullMap}
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <RNText
              style={{
                fontSize: 13,
                lineHeight: 18,
                fontWeight: '700',
                color: colors.primary,
                includeFontPadding: false,
                marginRight: 2,
              }}
            >
              {t('home.map_cta')}
            </RNText>
            <ChevronRight size={15} color={colors.primary} strokeWidth={2.2} />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  mapFrame: {
    height: 300,
    backgroundColor: '#DCE6F0',
  },
  mapTouch: { flex: 1 },
  topChrome: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 5,
  },
  titleCard: {
    flex: 1,
    minWidth: 0,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    shadowColor: '#0F172A',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  openChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 11,
    borderRadius: 18,
    borderWidth: 1,
    flexShrink: 0,
  },
  openDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  expandBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
  },
  segment: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    flexDirection: 'row',
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    zIndex: 5,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  segmentItem: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderTopWidth: 1,
  },
  legendRow: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    minWidth: 0,
  },
  legendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
    paddingRight: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
});
