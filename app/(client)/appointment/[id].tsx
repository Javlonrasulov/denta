import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Calendar, Clock, MapPin } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ErrorState } from '@/components/states/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useAppointment } from '@/hooks/queries';
import { useAppointmentsStore } from '@/store/appointmentsStore';
import { useTheme } from '@/theme';
import { formatPrice } from '@/utils/slots';

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius } = useTheme();
  const query = useAppointment(id);
  const updateStatus = useAppointmentsStore((s) => s.updateAppointmentStatus);
  const storeApt = useAppointmentsStore((s) => s.appointments.find((a) => a.id === id));
  const appointment = storeApt ?? query.data;

  if (query.isLoading && !storeApt) return <ListSkeleton rows={5} />;
  if (!appointment) {
    return (
      <ErrorState
        title={t('error.something_wrong')}
        onRetry={() => query.refetch()}
        retryLabel={t('common.retry')}
      />
    );
  }

  const statusTone =
    appointment.status === 'upcoming'
      ? 'primary'
      : appointment.status === 'completed'
        ? 'success'
        : 'neutral';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.md,
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing['5xl'],
        gap: spacing.xl,
      }}
    >
      <Pressable onPress={() => router.back()} hitSlop={8} style={{ width: 44, height: 44, justifyContent: 'center' }}>
        <ArrowLeft size={22} color={colors.text} />
      </Pressable>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="h1">{t('appointments.details')}</Text>
        <Badge
          label={t(`appointments.status_${appointment.status}`)}
          tone={statusTone}
        />
      </View>

      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          padding: spacing.xl,
          gap: spacing.md,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
        }}
      >
        <Text variant="h3">{appointment.doctorName}</Text>
        <Text variant="body" muted>
          {appointment.clinicName}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Calendar size={16} color={colors.textMuted} />
          <Text variant="body">{appointment.date}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Clock size={16} color={colors.textMuted} />
          <Text variant="body">{appointment.time}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <MapPin size={16} color={colors.textMuted} />
          <Text variant="body" muted style={{ flex: 1 }}>
            {appointment.clinicAddress}
          </Text>
        </View>
        <Text variant="body">{appointment.serviceName}</Text>
        <Text variant="h3" color={colors.primary}>
          {formatPrice(appointment.price)} so&apos;m
        </Text>
      </View>

      {appointment.status === 'upcoming' ? (
        <View style={{ gap: spacing.md }}>
          <Button
            title={t('appointments.reschedule')}
            variant="outline"
            fullWidth
            onPress={() =>
              router.push(`/(client)/doctor/${appointment.doctorId}`)
            }
          />
          <Button
            title={t('appointments.cancel_appointment')}
            variant="danger"
            fullWidth
            onPress={() => {
              updateStatus(appointment.id, 'cancelled');
              router.back();
            }}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}
