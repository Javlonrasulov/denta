import { router } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ClinicCard } from '@/components/clinic/ClinicCard';
import { DoctorCard } from '@/components/doctor/DoctorCard';
import { EmptyState } from '@/components/states/EmptyState';
import { Text } from '@/components/ui/Text';
import { useClinics, useDoctors } from '@/hooks/queries';
import { useFavoritesStore } from '@/store/userStore';
import { useTheme } from '@/theme';

export default function FavoritesScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius } = useTheme();
  const [tab, setTab] = useState<'clinics' | 'doctors'>('clinics');
  const clinicIds = useFavoritesStore((s) => s.clinicIds);
  const doctorIds = useFavoritesStore((s) => s.doctorIds);
  const clinics = useClinics();
  const doctors = useDoctors();

  const favClinics = useMemo(
    () => (clinics.data ?? []).filter((c) => clinicIds.includes(c.id)),
    [clinics.data, clinicIds],
  );
  const favDoctors = useMemo(
    () => (doctors.data ?? []).filter((d) => doctorIds.includes(d.id)),
    [doctors.data, doctorIds],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.lg }}>
        <Text variant="h1">{t('favorites.title')}</Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {(['clinics', 'doctors'] as const).map((key) => (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              style={{
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.sm + 2,
                borderRadius: radius.full,
                backgroundColor: tab === key ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: tab === key ? colors.primary : colors.border,
              }}
            >
              <Text variant="label" color={tab === key ? colors.textInverse : colors.textSecondary}>
                {t(`favorites.${key}`)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {tab === 'clinics' ? (
        favClinics.length === 0 ? (
          <EmptyState
            icon={Heart}
            title={t('favorites.empty_clinics')}
            actionLabel={t('favorites.empty_cta')}
            onAction={() => router.push('/(client)/(tabs)/search')}
          />
        ) : (
          <FlatList
            data={favClinics}
            keyExtractor={(i) => i.id}
            contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}
            renderItem={({ item }) => (
              <ClinicCard
                clinic={item}
                onPress={() => router.push(`/(client)/clinic/${item.id}`)}
              />
            )}
          />
        )
      ) : favDoctors.length === 0 ? (
        <EmptyState
          icon={Heart}
          title={t('favorites.empty_doctors')}
          actionLabel={t('favorites.empty_cta')}
          onAction={() => router.push('/(client)/(tabs)/search')}
        />
      ) : (
        <FlatList
          data={favDoctors}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}
          renderItem={({ item }) => (
            <DoctorCard
              doctor={item}
              onPress={() => router.push(`/(client)/doctor/${item.id}`)}
            />
          )}
        />
      )}
    </View>
  );
}
