import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { Building2, Heart, Stethoscope } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';

import type { FavoritesTab } from './FavoritesSegmented';

type Props = {
  tab: FavoritesTab;
  onPrimary: () => void;
  onSecondary?: () => void;
};

export function FavoritesEmptyState({ tab, onPrimary, onSecondary }: Props) {
  const { t } = useTranslation();
  const { colors, spacing, radius, shadows, isDark } = useTheme();
  const isClinics = tab === 'clinics';
  const Icon = isClinics ? Building2 : Stethoscope;

  return (
    <View
      style={{
        flexGrow: 1,
        paddingTop: spacing.lg,
        paddingBottom: spacing.xl,
        alignItems: 'center',
        justifyContent: 'flex-start',
      }}
    >
      <View
        style={[
          shadows.md,
          {
            width: '100%',
            maxWidth: 380,
            borderRadius: radius['2xl'],
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            paddingHorizontal: spacing.xl,
            paddingTop: spacing['2xl'],
            paddingBottom: spacing.xl,
            alignItems: 'center',
            gap: spacing.md,
          },
        ]}
      >
        <LinearGradient
          colors={
            isDark
              ? ['rgba(244,63,94,0.2)', 'rgba(129,140,248,0.18)']
              : ['#FFE4E6', '#EEF2FF']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 88,
            height: 88,
            borderRadius: 28,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 4,
          }}
        >
          <View style={{ position: 'relative' }}>
            <Icon size={34} color={colors.primary} strokeWidth={1.7} />
            <View
              style={{
                position: 'absolute',
                right: -10,
                top: -8,
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: isDark ? '#4C0519' : '#FFF1F2',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Heart size={11} color="#E11D48" fill="#E11D48" strokeWidth={1.8} />
            </View>
          </View>
        </LinearGradient>

        <Text variant="h2" center style={{ fontSize: 20, lineHeight: 26 }}>
          {isClinics ? t('favorites.empty_clinics_title') : t('favorites.empty_doctors_title')}
        </Text>
        <Text
          variant="bodySmall"
          muted
          center
          style={{ maxWidth: 280, lineHeight: 20 }}
        >
          {isClinics
            ? t('favorites.empty_clinics_subtitle')
            : t('favorites.empty_doctors_subtitle')}
        </Text>

        <View style={{ width: '100%', gap: spacing.sm, marginTop: spacing.sm }}>
          <Button
            title={isClinics ? t('favorites.empty_clinics_cta') : t('favorites.empty_doctors_cta')}
            onPress={onPrimary}
            fullWidth
            size="lg"
          />
          {isClinics && onSecondary ? (
            <Button
              title={t('favorites.empty_clinics_secondary')}
              onPress={onSecondary}
              variant="outline"
              fullWidth
              size="md"
            />
          ) : null}
        </View>
      </View>

      <View
        style={{
          width: '100%',
          maxWidth: 380,
          marginTop: spacing.lg,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          borderRadius: radius.xl,
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: colors.border,
          backgroundColor: isDark ? colors.surfaceSoft : '#F8FAFC',
        }}
      >
        <Text
          variant="caption"
          muted
          center
          style={{ lineHeight: 18, fontSize: 12 }}
        >
          {t('favorites.empty_hint')}
        </Text>
      </View>
    </View>
  );
}
