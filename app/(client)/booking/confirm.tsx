import { router } from 'expo-router';
import { ArrowLeft, Calendar, Clock, MapPin, Stethoscope } from '@/components/icons';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useClinic, useDoctor } from '@/hooks/queries';
import { useAppointmentsStore } from '@/store/appointmentsStore';
import { useUserStore } from '@/store/userStore';
import { useTheme } from '@/theme';
import { formatPrice } from '@/utils/slots';

export default function BookingConfirmScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius } = useTheme();
  const draft = useAppointmentsStore((s) => s.draft);
  const addAppointment = useAppointmentsStore((s) => s.addAppointment);
  const user = useUserStore();
  const doctor = useDoctor(draft.doctorId ?? '');
  const clinic = useClinic(draft.clinicId ?? '');

  const onConfirm = () => {
    if (!draft.doctorId || !draft.clinicId || !draft.date || !draft.time) return;
    addAppointment({
      id: `apt-${Date.now()}`,
      doctorId: draft.doctorId,
      clinicId: draft.clinicId,
      patientId: user.id,
      patientName: user.fullName,
      doctorName: doctor.data?.fullName ?? '',
      clinicName: clinic.data?.name ?? '',
      clinicAddress: clinic.data?.address ?? '',
      serviceName: draft.serviceName ?? 'Consultation',
      date: draft.date,
      time: draft.time,
      status: 'upcoming',
      price: draft.price ?? 0,
    });
    router.replace('/(client)/booking/success');
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
