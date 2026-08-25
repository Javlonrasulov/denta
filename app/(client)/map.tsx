import { router } from 'expo-router';
import { ArrowLeft, MapPin, Navigation } from '@/components/icons';
import { useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { MobileCard, MobileIconButton } from '@/components/mobile';
import { Button } from '@/components/ui/Button';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useClinicMarkers } from '@/hooks/queries';
import { useTheme } from '@/theme';
import type { MapMarker } from '@/services/mapService';

export default function MapScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius } = useTheme();
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
        <MobileIconButton onPress={() => router.back()} accessibilityLabel="Back">
          <ArrowLeft size={20} color={colors.text} strokeWidth={1.8} />
        </MobileIconButton>
        <Text variant="h2" style={{ flex: 1 }}>
          {t('map.title')}
        </Text>
      </View>

      <View
        style={{
          marginHorizontal: spacing.xl,
          height: 200,
          borderRadius: radius.xl,
          backgroundColor: colors.surfaceSoft,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.lg,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: radius.lg,
            backgroundColor: colors.primaryMuted,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.sm,
          }}
        >
          <Navigation size={24} color={colors.primary} strokeWidth={1.75} />
        </View>
        <Text variant="caption" weight="semibold" color={colors.primary}>
          Mapbox ready · Toshkent
        </Text>
        <View
          style={{
            position: 'absolute',
            top: 28,
            left: 44,
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: colors.mapPin ?? colors.primary,
            opacity: 0.85,
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: 72,
            right: 52,
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: colors.mapPin ?? colors.primary,
            opacity: 0.85,
          }}
        />
        <View
          style={{
            position: 'absolute',
            bottom: 40,
            left: 96,
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: colors.mapPin ?? colors.primary,
            opacity: 0.85,
          }}
        />
      </View>

      {markers.isLoading ? (
        <ListSkeleton rows={4} />
      ) : (
        <FlatList
          data={markers.data}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            gap: spacing.sm,
            paddingBottom: 180,
          }}
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
              <MapPin size={16} color={colors.primary} strokeWidth={1.8} />
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Text variant="label" numberOfLines={1}>
                  {item.title}
                </Text>
                {item.subtitle ? (
                  <Text variant="caption" muted numberOfLines={1}>
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
          }}
        >
          <MobileCard>
            <Text variant="h3">{selected.title}</Text>
            {selected.subtitle ? (
              <Text variant="bodySmall" muted style={{ marginTop: 4, marginBottom: spacing.md }}>
                {selected.subtitle}
              </Text>
            ) : (
              <View style={{ height: spacing.md }} />
            )}
            <Button
              title={t('map.view_clinic')}
              fullWidth
              onPress={() => router.push(`/(client)/clinic/${selected.id}`)}
            />
          </MobileCard>
        </View>
      ) : null}
    </View>
  );
}
