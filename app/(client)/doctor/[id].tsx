import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Heart } from 'lucide-react-native';
import { addDays, format } from 'date-fns';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { DateStrip, SlotPicker } from '@/components/booking/SlotPicker';
import { ErrorState } from '@/components/states/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useClinic, useDoctor } from '@/hooks/queries';
import { useAppointmentsStore } from '@/store/appointmentsStore';
import { useFavoritesStore } from '@/store/userStore';
import { useTheme } from '@/theme';
import { generateTimeSlots, formatPrice } from '@/utils/slots';

export default function DoctorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius } = useTheme();
  const doctorQuery = useDoctor(id);
  const clinicQuery = useClinic(doctorQuery.data?.clinicId ?? '');
  const appointments = useAppointmentsStore((s) => s.appointments);
  const setDraft = useAppointmentsStore((s) => s.setDraft);
  const toggleDoctor = useFavoritesStore((s) => s.toggleDoctor);
  const isFavorite = useFavoritesStore((s) => s.isDoctorFavorite(id));

  const dates = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, i) => {
        const d = addDays(new Date('2026-08-23'), i);
        return {
          date: format(d, 'yyyy-MM-dd'),
          label: format(d, 'd'),
          sub: format(d, 'EEE'),
        };
      }),
    [],
  );

  const [selectedDate, setSelectedDate] = useState(dates[0].date);
  const [selectedTime, setSelectedTime] = useState<string>();

  const slots = useMemo(() => {
    if (!doctorQuery.data) return [];
    return generateTimeSlots(doctorQuery.data, selectedDate, appointments);
  }, [doctorQuery.data, selectedDate, appointments]);

  if (doctorQuery.isLoading) return <ListSkeleton rows={6} />;
  if (!doctorQuery.data) {
    return (
      <ErrorState
        title={t('error.something_wrong')}
        onRetry={() => doctorQuery.refetch()}
        retryLabel={t('common.retry')}
      />
    );
  }

  const doctor = doctorQuery.data;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120, paddingTop: insets.top }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.xl,
            marginBottom: spacing.lg,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <ArrowLeft size={20} color={colors.text} />
          </Pressable>
          <Pressable
            onPress={() => toggleDoctor(doctor.id)}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Heart
              size={18}
              color={isFavorite ? colors.error : colors.text}
              fill={isFavorite ? colors.error : 'transparent'}
            />
          </Pressable>
        </View>

        <View style={{ alignItems: 'center', paddingHorizontal: spacing.xl, gap: spacing.sm }}>
          <Avatar uri={doctor.photoUrl} name={doctor.fullName} size={96} />
          <Text variant="h1" center>
            {doctor.fullName}
          </Text>
          <Text variant="body" color={colors.secondary} center>
            {doctor.specialization}
          </Text>
          <Text variant="bodySmall" muted center>
            {t('doctor.experience_years', { years: doctor.experienceYears })} · ★ {doctor.rating.toFixed(1)}
          </Text>
          {clinicQuery.data ? (
            <Text variant="caption" muted>
              {t('doctor.at_clinic', { clinic: clinicQuery.data.name })}
            </Text>
          ) : null}
        </View>

        <View style={{ padding: spacing.xl, gap: spacing.xl }}>
          <View>
            <Text variant="h3" style={{ marginBottom: spacing.sm }}>
              {t('doctor.about')}
            </Text>
            <Text variant="body" muted>
              {doctor.bio}
            </Text>
          </View>

          <View>
            <Text variant="h3" style={{ marginBottom: spacing.md }}>
              {t('doctor.services')}
            </Text>
            <View style={{ gap: spacing.sm }}>
              {doctor.services.map((svc) => (
                <View
                  key={svc.id}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    padding: spacing.md,
                    backgroundColor: colors.surface,
                    borderRadius: radius.lg,
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                  }}
                >
                  <Text variant="body">{svc.name}</Text>
                  <Text variant="label" color={colors.primary}>
                    {formatPrice(svc.price)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ gap: spacing.md }}>
            <Text variant="h3">{t('booking.choose_datetime')}</Text>
            <DateStrip dates={dates} selected={selectedDate} onSelect={setSelectedDate} />
            <SlotPicker slots={slots} selected={selectedTime} onSelect={setSelectedTime} />
          </View>
        </View>
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: spacing.xl,
          paddingBottom: insets.bottom + spacing.md,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.borderSubtle,
        }}
      >
        <Button
          title={t('doctor.book_now')}
          fullWidth
          size="lg"
          disabled={!selectedTime}
          onPress={() => {
            const service = doctor.services[0];
            setDraft({
              clinicId: doctor.clinicId,
              doctorId: doctor.id,
              serviceId: service?.id,
              serviceName: service?.name,
              price: service?.price ?? doctor.priceFrom,
              date: selectedDate,
              time: selectedTime,
            });
            router.push('/(client)/booking/confirm');
          }}
        />
      </View>
    </View>
  );
}
