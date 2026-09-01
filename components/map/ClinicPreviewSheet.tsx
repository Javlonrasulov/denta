import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { forwardRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { BadgeCheck, Heart, Star } from '@/components/icons';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { formatDistance } from './mapUtils';
import type { Clinic } from '@/types';
import { useTheme } from '@/theme';

type Props = {
  clinic: Clinic | null;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onViewClinic?: () => void;
  onChange?: (index: number) => void;
};

export const ClinicPreviewSheet = forwardRef<BottomSheet, Props>(
  function ClinicPreviewSheet(
    { clinic, isFavorite, onToggleFavorite, onViewClinic, onChange },
    ref,
  ) {
    const { t } = useTranslation();
    const { colors, spacing, radius, shadows } = useTheme();
    const snapPoints = useMemo(() => ['28%', '42%'], []);

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onChange={onChange}
        backgroundStyle={{
          backgroundColor: colors.surface,
          borderTopLeftRadius: radius['2xl'],
          borderTopRightRadius: radius['2xl'],
          ...shadows.lg,
        }}
        handleIndicatorStyle={{
          backgroundColor: colors.border,
          width: 40,
        }}
      >
        <BottomSheetView style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}>
          {!clinic ? (
            <View style={{ height: 120 }} />
          ) : (
            <View style={{ gap: spacing.md }}>
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <Image
                  source={{ uri: clinic.coverUrl }}
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: radius.lg,
                    backgroundColor: colors.skeleton,
                  }}
                  contentFit="cover"
                />
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text variant="h3" numberOfLines={1} style={{ flex: 1 }}>
                      {clinic.name}
                    </Text>
                    <BadgeCheck color={colors.secondary} size={18} />
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Star color={colors.star} size={14} fill={colors.star} />
                    <Text variant="bodySmall" style={{ fontWeight: '600' }}>
                      {clinic.rating.toFixed(1)}
                    </Text>
                    <Text variant="caption" muted>
                      {clinic.reviewCount} {t('clinic.reviews').toLowerCase()}
                    </Text>
                    {clinic.distanceKm != null && (
                      <Text variant="caption" muted>
                        · {formatDistance(clinic.distanceKm)}
                      </Text>
                    )}
                  </View>
                  <Text variant="caption" muted numberOfLines={1}>
                    {clinic.address}
                  </Text>
                  <Text
                    variant="caption"
                    style={{
                      color: clinic.isOpenNow ? colors.success : colors.textMuted,
                      fontWeight: '600',
                    }}
                  >
                    {clinic.isOpenNow
                      ? t('map.slots_today')
                      : t('clinic.closed_now')}
                  </Text>
                </View>
              </View>

              {clinic.isOpenNow && (
                <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
                  {['10:00', '11:00', '12:00', '14:00'].map((slot) => (
                    <View
                      key={slot}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: radius.full,
                        backgroundColor: colors.primaryMuted,
                      }}
                    >
                      <Text variant="caption" style={{ color: colors.primary, fontWeight: '600' }}>
                        {slot}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Button
                    title={t('clinic.view_clinic')}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      onViewClinic?.();
                    }}
                  />
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onToggleFavorite?.();
                  }}
                  style={[
                    styles.fav,
                    {
                      borderColor: colors.borderSubtle,
                      borderRadius: radius.lg,
                      backgroundColor: colors.surfaceSoft,
                    },
                  ]}
                >
                  <Heart
                    color={isFavorite ? colors.error : colors.textMuted}
                    fill={isFavorite ? colors.error : 'transparent'}
                    size={22}
                  />
                </Pressable>
              </View>
            </View>
          )}
        </BottomSheetView>
      </BottomSheet>
    );
  },
);

const styles = StyleSheet.create({
  fav: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
