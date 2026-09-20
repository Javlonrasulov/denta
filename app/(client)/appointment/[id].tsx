import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Calendar, Clock, MapPin } from '@/components/icons';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ErrorState } from '@/components/states/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { queryKeys, useAppointment } from '@/hooks/queries';
import { cancelAppointment } from '@/services/appointmentService';
import { useAppointmentsStore } from '@/store/appointmentsStore';
import { useToastStore } from '@/store/toastStore';
import { useTheme } from '@/theme';
import { formatPrice } from '@/utils/slots';

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius } = useTheme();
  const query = useAppointment(id);
  const queryClient = useQueryClient();
  const setDraft = useAppointmentsStore((s) => s.setDraft);
  const showToast = useToastStore((s) => s.showToast);
  const [cancelling, setCancelling] = useState(false);
  const appointment = query.data;

  if (query.isLoading) return <ListSkeleton rows={5} />;
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
      <Pressable onPress={() => router.back()} hitSlop={8} style={{ width: 40, height: 40, justifyContent: 'center' }}>
        <ArrowLeft size={22} color={colors.text} strokeWidth={1.8} />
      </Pressable>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md }}>
        <Text variant="h2" style={{ flex: 1 }}>
          {t('appointments.details')}
        </Text>
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
        <Text variant="bodySmall" muted>
          {appointment.clinicName}
        </Text>
        <View style={{ height: 1, backgroundColor: colors.borderSubtle, marginVertical: 4 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Calendar size={16} color={colors.textMuted} strokeWidth={1.8} />
          <Text variant="body">{appointment.date}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Clock size={16} color={colors.textMuted} strokeWidth={1.8} />
          <Text variant="body">{appointment.time}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <MapPin size={16} color={colors.textMuted} strokeWidth={1.8} />
          <Text variant="bodySmall" muted style={{ flex: 1 }}>
            {appointment.clinicAddress}
          </Text>
        </View>
        <Text variant="label" color={colors.primary}>
          {appointment.serviceName}
        </Text>
        <Text variant="h3" color={colors.primary}>
          {formatPrice(appointment.price)}
        </Text>
      </View>

      {appointment.status === 'upcoming' ? (
        <View style={{ gap: spacing.md }}>
          <Button
            title={t('appointments.reschedule')}
            variant="outline"
            fullWidth
            onPress={() => {
              setDraft({
                clinicId: appointment.clinicId,
                doctorId: appointment.doctorId,
                rescheduleAppointmentId: appointment.id,
              });
              router.push(`/(client)/doctor/${appointment.doctorId}`);
            }}
          />
          <Button
            title={t('appointments.cancel_appointment')}
            variant="danger"
            fullWidth
            loading={cancelling}
            onPress={() => {
              setCancelling(true);
              void (async () => {
                try {
                  await cancelAppointment(appointment.id);
                  await queryClient.invalidateQueries({
                    queryKey: queryKeys.appointments.all,
                  });
                  router.back();
                } catch (err) {
                  showToast({
                    tone: 'error',
                    title: t('error.something_wrong'),
                    message: err instanceof Error ? err.message : '',
                  });
                } finally {
                  setCancelling(false);
                }
              })();
            }}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}
