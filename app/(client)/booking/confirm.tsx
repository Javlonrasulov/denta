import { router } from 'expo-router';
import { useState } from 'react';
import { ArrowLeft, Calendar, Clock, MapPin, Stethoscope } from '@/components/icons';
import { Pressable, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { queryKeys, useClinic, useDoctor } from '@/hooks/queries';
import {
  createAppointment,
  rescheduleAppointment,
} from '@/services/appointmentService';
import { ApiError } from '@/services/apiClient';
import {
  getApiErrorMessage,
  resolveErrorLocale,
} from '@/services/errorMessages';
import { useAppointmentsStore } from '@/store/appointmentsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useToastStore } from '@/store/toastStore';
import { useTheme } from '@/theme';
import { formatPrice } from '@/utils/slots';

export default function BookingConfirmScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius } = useTheme();
  const draft = useAppointmentsStore((s) => s.draft);
  const clearDraft = useAppointmentsStore((s) => s.clearDraft);
  const addAppointment = useAppointmentsStore((s) => s.addAppointment);
  const showToast = useToastStore((s) => s.showToast);
  const locale = useSettingsStore((s) => s.locale);
  const queryClient = useQueryClient();
  const doctor = useDoctor(draft.doctorId ?? '');
  const clinic = useClinic(draft.clinicId ?? '');
  const [loading, setLoading] = useState(false);

  const onConfirm = () => {
    if (!draft.doctorId || !draft.clinicId || !draft.date || !draft.time) return;
    setLoading(true);
    void (async () => {
      try {
        const created = draft.rescheduleAppointmentId
          ? await rescheduleAppointment(draft.rescheduleAppointmentId, {
              date: draft.date!,
              time: draft.time!,
            })
          : await createAppointment({
              doctorId: draft.doctorId!,
              clinicId: draft.clinicId!,
              serviceId: draft.serviceId,
              date: draft.date!,
              time: draft.time!,
              serviceName: draft.serviceName ?? 'Consultation',
              doctorName: doctor.data?.fullName ?? '',
              clinicName: clinic.data?.name ?? '',
              clinicAddress: clinic.data?.address ?? '',
              patientId: '',
              patientName: '',
              status: 'upcoming',
              price: draft.price ?? 0,
            });
        addAppointment(created);
        clearDraft();
        await queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
        router.replace('/(client)/booking/success');
      } catch (err) {
        const code =
          err instanceof ApiError
            ? err.code
            : err instanceof TypeError
              ? 'NETWORK_ERROR'
              : undefined;
        const mapped = getApiErrorMessage(
          code,
          resolveErrorLocale(locale || i18n.language),
        );
        showToast({
          tone: 'error',
          title:
            mapped ??
            (code === 'SLOT_TAKEN'
              ? t('booking.slot_taken', { defaultValue: 'Slot taken' })
              : t('booking.failed', { defaultValue: 'Booking failed' })),
          message: mapped ? '' : err instanceof Error ? err.message : '',
        });
      } finally {
        setLoading(false);
      }
    })();
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: insets.top,
        paddingHorizontal: spacing.xl,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.md }}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={22} color={colors.text} strokeWidth={1.8} />
        </Pressable>
        <Text variant="h2">{t('booking.confirm')}</Text>
      </View>

      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          padding: spacing.xl,
          gap: spacing.lg,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
        }}
      >
        <Text variant="h3">{t('booking.your_appointment')}</Text>
        <Row icon={Stethoscope} label={doctor.data?.fullName ?? '—'} colors={colors} spacing={spacing} />
        <Row icon={MapPin} label={clinic.data?.name ?? '—'} colors={colors} spacing={spacing} />
        <Row icon={Calendar} label={draft.date ?? '—'} colors={colors} spacing={spacing} />
        <Row icon={Clock} label={draft.time ?? '—'} colors={colors} spacing={spacing} />
        <View style={{ height: 1, backgroundColor: colors.borderSubtle }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="bodySmall" muted>
            {draft.serviceName}
          </Text>
          <Text variant="h3" color={colors.primary}>
            {formatPrice(draft.price ?? 0)}
          </Text>
        </View>
      </View>

      <View style={{ flex: 1 }} />
      <Button
        title={t('booking.confirm_booking')}
        fullWidth
        size="lg"
        loading={loading}
        onPress={onConfirm}
        style={{ marginBottom: insets.bottom + spacing.lg }}
      />
    </View>
  );
}

function Row({
  icon: Icon,
  label,
  colors,
  spacing,
}: {
  icon: typeof Calendar;
  label: string;
  colors: { textMuted: string; text: string };
  spacing: { md: number; sm: number };
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <Icon size={18} color={colors.textMuted} />
      <Text variant="body">{label}</Text>
    </View>
  );
}
