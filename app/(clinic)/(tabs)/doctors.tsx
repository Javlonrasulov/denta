import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { DoctorCard } from '@/components/doctor/DoctorCard';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useDoctors } from '@/hooks/queries';
import { useTheme } from '@/theme';

export default function ClinicDoctorsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, spacing } = useTheme();
  const doctors = useDoctors();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md, marginBottom: spacing.md }}>
        <Text variant="h1">{t('clinic_crm.doctors')}</Text>
      </View>
      {doctors.isLoading ? (
        <ListSkeleton rows={5} />
      ) : (
        <FlatList
          data={doctors.data}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.md, paddingBottom: spacing['4xl'] }}
          renderItem={({ item }) => <DoctorCard doctor={item} />}
        />
      )}
    </View>
  );
}
