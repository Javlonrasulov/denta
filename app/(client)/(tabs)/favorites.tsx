import { router } from 'expo-router';
import { Heart } from '@/components/icons';
import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ClinicCard } from '@/components/clinic/ClinicCard';
import { DoctorCard } from '@/components/doctor/DoctorCard';
import { MobileEmpty, MobileHeader, MobileSegmented } from '@/components/mobile';
import { useClinics, useDoctors } from '@/hooks/queries';
import { useFavoritesStore } from '@/store/userStore';
import { useTheme } from '@/theme';

export default function FavoritesScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, spacing } = useTheme();
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
        <MobileHeader title={t('favorites.title')} />
        <MobileSegmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'clinics', label: t('favorites.clinics') },
            { value: 'doctors', label: t('favorites.doctors') },
          ]}
        />
      </View>

      {tab === 'clinics' ? (
        favClinics.length === 0 ? (
          <MobileEmpty
            icon={Heart}
            title={t('favorites.empty_clinics')}
            actionLabel={t('favorites.empty_cta')}
            onAction={() => router.push('/(client)/(tabs)/search')}
          />
        ) : (
          <FlatList
            data={favClinics}
            keyExtractor={(i) => i.id}
            contentContainerStyle={{ padding: spacing.xl, gap: spacing.md, paddingBottom: spacing['5xl'] }}
            renderItem={({ item }) => (
              <ClinicCard clinic={item} onPress={() => router.push(`/(client)/clinic/${item.id}`)} />
            )}
          />
        )
      ) : favDoctors.length === 0 ? (
        <MobileEmpty
          icon={Heart}
          title={t('favorites.empty_doctors')}
          actionLabel={t('favorites.empty_cta')}
          onAction={() => router.push('/(client)/(tabs)/search')}
        />
      ) : (
        <FlatList
          data={favDoctors}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.sm, paddingBottom: spacing['5xl'] }}
          renderItem={({ item }) => (
            <DoctorCard doctor={item} onPress={() => router.push(`/(client)/doctor/${item.id}`)} />
          )}
        />
      )}
    </View>
  );
}
