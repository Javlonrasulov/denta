import { Image } from 'expo-image';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text as RNText,
  View,
} from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { forwardRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BadgeCheck,
  Car,
  Clock,
  Heart,
  MapPin,
  Navigation,
  Star,
} from '@/components/icons';
import type { Clinic } from '@/types';
import { useTheme } from '@/theme';
import { formatPrice } from '@/utils/slots';

export type RoutePreviewInfo = {
  distanceLabel: string;
  durationLabel: string;
  loading?: boolean;
  error?: string | null;
};

type Props = {
  clinic: Clinic | null;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onViewClinic?: () => void;
  onBook?: () => void;
  onNavigator?: () => void;
  onRetryRoute?: () => void;
  onChange?: (index: number) => void;
  routeInfo?: RoutePreviewInfo | null;
};

export const ClinicPreviewSheet = forwardRef<BottomSheet, Props>(
  function ClinicPreviewSheet(
    {
      clinic,
      isFavorite,
      onToggleFavorite,
      onViewClinic,
      onBook,
      onNavigator,
      onRetryRoute,
      onChange,
      routeInfo,
    },
    ref,
  ) {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();
    const snapPoints = useMemo(
      () => [320 + Math.max(insets.bottom, 8), 400],
      [insets.bottom],
    );

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onChange={onChange}
        backgroundStyle={{
          backgroundColor: colors.surface,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          shadowColor: '#0F172A',
          shadowOpacity: 0.12,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -4 },
          elevation: 12,
        }}
        handleIndicatorStyle={{
          backgroundColor: colors.border,
          width: 36,
        }}
      >
        <BottomSheetView
          style={{
            paddingHorizontal: 16,
            paddingBottom: Math.max(insets.bottom, 12) + 8,
          }}
        >
          {!clinic ? (
            <View style={{ height: 120 }} />
          ) : (
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Image
                  source={{ uri: clinic.coverUrl }}
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: 16,
                    backgroundColor: colors.skeleton,
                  }}
                  contentFit="cover"
                />
                <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <RNText
                      numberOfLines={2}
                      style={{
                        flex: 1,
                        fontSize: 16,
                        lineHeight: 21,
                        fontWeight: '700',
                        color: colors.text,
                        includeFontPadding: false,
                      }}
                    >
                      {clinic.name}
                    </RNText>
                    <BadgeCheck color={colors.secondary} size={16} />
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                    <Star color={colors.star} size={13} fill={colors.star} />
                    <RNText style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>
                      {clinic.rating.toFixed(1)}
                    </RNText>
                    <RNText style={{ fontSize: 12, color: colors.textMuted }}>
                      ({clinic.reviewCount})
                    </RNText>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <MapPin size={12} color={colors.textMuted} />
                    <RNText
                      numberOfLines={1}
                      style={{
                        flex: 1,
                        fontSize: 12,
                        color: colors.textMuted,
                        includeFontPadding: false,
                      }}
                    >
                      {clinic.address}
                    </RNText>
                  </View>
                </View>
              </View>

              {/* Route row */}
              <View
                style={[
                  styles.routeRow,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.surfaceSoft,
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)',
                  },
                ]}
              >
                {routeInfo?.loading ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <RNText
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: colors.textMuted,
                        includeFontPadding: false,
                      }}
                    >
                      {t('map.route_loading')}
                    </RNText>
                  </View>
                ) : routeInfo?.error ? (
                  <View style={{ flex: 1, gap: 6 }}>
                    <RNText
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: colors.text,
                        includeFontPadding: false,
                      }}
                    >
                      {routeInfo.error}
                    </RNText>
                    <Pressable onPress={onRetryRoute}>
                      <RNText
                        style={{
                          fontSize: 13,
                          fontWeight: '700',
                          color: colors.primary,
                          includeFontPadding: false,
                        }}
                      >
                        {t('common.retry')}
                      </RNText>
                    </Pressable>
                  </View>
                ) : routeInfo ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Car size={15} color={colors.primary} />
                      <RNText
                        style={{
                          fontSize: 13,
                          fontWeight: '700',
                          color: colors.text,
                          includeFontPadding: false,
                        }}
                      >
                        {routeInfo.distanceLabel}
                      </RNText>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Clock size={15} color={colors.primary} />
                      <RNText
                        style={{
                          fontSize: 13,
                          fontWeight: '700',
                          color: colors.text,
                          includeFontPadding: false,
                        }}
                      >
                        {routeInfo.durationLabel}
                      </RNText>
                    </View>
                  </View>
                ) : (
                  <RNText
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: colors.textMuted,
                      includeFontPadding: false,
                    }}
                  >
                    {t('map.route_hint')}
                  </RNText>
                )}
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <RNText
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: clinic.isOpenNow ? colors.success : colors.textMuted,
                    includeFontPadding: false,
                  }}
                >
                  {clinic.isOpenNow ? t('clinic.open_now') : t('clinic.closed_now')}
                </RNText>
                <RNText
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: colors.primary,
                    includeFontPadding: false,
                  }}
                >
                  {t('map.from_price', { price: formatPrice(clinic.priceFrom) })}
                </RNText>
              </View>

              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <Pressable
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onViewClinic?.();
                  }}
                  style={{
                    flex: 1,
                    height: 48,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: isDark ? colors.borderSubtle : 'rgba(15,23,42,0.1)',
                    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.surfaceSoft,
                  }}
                >
                  <RNText
                    style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: colors.text,
                      includeFontPadding: false,
                      fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : undefined,
                    }}
                  >
                    {t('map.view_clinic')}
                  </RNText>
                </Pressable>
                <Pressable
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onBook?.();
                  }}
                  style={{
                    flex: 1.1,
                    height: 48,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.primary,
                  }}
                >
                  <RNText
                    style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: '#FFFFFF',
                      includeFontPadding: false,
                    }}
                  >
                    {t('map.book_cta')}
                  </RNText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('map.navigator')}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onNavigator?.();
                  }}
                  style={[
                    styles.navBtn,
                    {
                      backgroundColor: colors.secondary,
                    },
                  ]}
                >
                  <Navigation size={18} color="#FFFFFF" />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onToggleFavorite?.();
                  }}
                  style={[
                    styles.fav,
                    {
                      borderColor: isDark ? colors.borderSubtle : 'rgba(15,23,42,0.1)',
                      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.surfaceSoft,
                    },
                  ]}
                >
                  <Heart
                    color={isFavorite ? colors.error : colors.textMuted}
                    fill={isFavorite ? colors.error : 'transparent'}
                    size={20}
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
  routeRow: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  fav: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 14,
  },
  navBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
});
