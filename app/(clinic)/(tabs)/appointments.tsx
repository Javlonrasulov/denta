import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppointmentCard } from '@/components/appointments/AppointmentCard';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useAppointments } from '@/hooks/queries';
import { useTheme } from '@/theme';

export default function ClinicAppointmentsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, spacing } = useTheme();
  const appointments = useAppointments();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md }}>
        <Text variant="h1">{t('tabs.appointments')}</Text>
      </View>
      {appointments.isLoading ? (
        <ListSkeleton rows={5} />
      ) : (
        <FlatList
          data={appointments.data}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}
          renderItem={({ item }) => <AppointmentCard appointment={item} />}
        />
      )}
    </View>
  );
}
