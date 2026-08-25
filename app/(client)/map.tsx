import { router } from 'expo-router';
import { ArrowLeft, MapPin, Navigation } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useClinicMarkers } from '@/hooks/queries';
import { useTheme } from '@/theme';
import type { MapMarker } from '@/services/mapService';

/**
 * Mapbox-ready map screen.
 * Currently renders a premium list/marker abstraction; swap MapCanvas for Mapbox later.
 */
export default function MapScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius, shadows } = useTheme();
  const markers = useClinicMarkers();
  const [selected, setSelected] = useState<MapMarker | null>(null);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <Text variant="h2">{t('map.title')}</Text>
      </View>

      <View
        style={{
          marginHorizontal: spacing.xl,
          height: 220,
          borderRadius: radius['2xl'],
          backgroundColor: colors.primaryMuted,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.lg,
          overflow: 'hidden',
          ...shadows.md,
        }}
      >
        <Navigation size={36} color={colors.primary} strokeWidth={1.5} />
        <Text variant="body" color={colors.primary} style={{ marginTop: spacing.sm }}>
          Mapbox ready · Toshkent
        </Text>
        <View
          style={{
            position: 'absolute',
            top: 24,
            left: 40,
            width: 14,
            height: 14,
            borderRadius: 7,
            backgroundColor: colors.mapPin ?? colors.primary,
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: 80,
            right: 56,
            width: 14,
            height: 14,
            borderRadius: 7,
            backgroundColor: colors.mapPin ?? colors.primary,
          }}
        />
        <View
          style={{
            position: 'absolute',
            bottom: 48,
            left: 90,
            width: 14,
            height: 14,
            borderRadius: 7,
            backgroundColor: colors.mapPin ?? colors.primary,
          }}
        />
      </View>

      {markers.isLoading ? (
        <ListSkeleton rows={4} />
      ) : (
        <FlatList
          data={markers.data}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.md, paddingBottom: 180 }}
          ListHeaderComponent={
            <Text variant="h3" style={{ marginBottom: spacing.sm }}>
              {t('map.nearby')}
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setSelected(item)}
              style={{
                flexDirection: 'row',
                gap: spacing.md,
                padding: spacing.lg,
                backgroundColor: selected?.id === item.id ? colors.primaryMuted : colors.surface,
                borderRadius: radius.xl,
                borderWidth: 1,
                borderColor: selected?.id === item.id ? colors.primary : colors.borderSubtle,
              }}
            >
              <MapPin size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text variant="body">{item.title}</Text>
                {item.subtitle ? (
                  <Text variant="caption" muted>
                    {item.subtitle}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          )}
        />
      )}

      {selected ? (
        <View
          style={{
            position: 'absolute',
            left: spacing.xl,
            right: spacing.xl,
            bottom: insets.bottom + spacing.lg,
            backgroundColor: colors.surface,
            borderRadius: radius['2xl'],
            padding: spacing.xl,
            gap: spacing.md,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            ...shadows.lg,
          }}
        >
          <Text variant="h3">{selected.title}</Text>
          {selected.subtitle ? (
            <Text variant="bodySmall" muted>
              {selected.subtitle}
            </Text>
          ) : null}
          <Button
            title={t('map.view_clinic')}
            fullWidth
            onPress={() => router.push(`/(client)/clinic/${selected.id}`)}
          />
        </View>
      ) : null}
    </View>
  );
}
