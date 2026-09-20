import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Heart } from '@/components/icons';
import { addDays, format } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { DateStrip, SlotPicker } from '@/components/booking/SlotPicker';
import { ErrorState } from '@/components/states/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useClinic, useDoctor } from '@/hooks/queries';
import { getDoctorSlots } from '@/services/doctorService';
import { getDoctorReviews } from '@/services/reviewService';
import { useAppointmentsStore } from '@/store/appointmentsStore';
import { useFavoritesStore } from '@/store/userStore';
import { useTheme } from '@/theme';
import { formatPrice } from '@/utils/slots';

export default function DoctorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius } = useTheme();
  const doctorQuery = useDoctor(id);
  const clinicQuery = useClinic(doctorQuery.data?.clinicId ?? '');
  const setDraft = useAppointmentsStore((s) => s.setDraft);
  const draft = useAppointmentsStore((s) => s.draft);
  const toggleDoctor = useFavoritesStore((s) => s.toggleDoctor);
  const isFavorite = useFavoritesStore((s) => s.isDoctorFavorite(id));

  const dates = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, i) => {
        const d = addDays(new Date(), i);
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
  const [selectedServiceId, setSelectedServiceId] = useState<string>();

  useEffect(() => {
    const first = doctorQuery.data?.services?.[0]?.id;
    if (first && !selectedServiceId) setSelectedServiceId(first);
  }, [doctorQuery.data?.services, selectedServiceId]);

  const slotsQuery = useQuery({
    queryKey: [
      'doctors',
      id,
      'slots',
      selectedDate,
      selectedServiceId,
      doctorQuery.data?.clinicId,
    ],
    enabled: Boolean(id && selectedDate && doctorQuery.data && selectedServiceId),
    queryFn: () =>
      getDoctorSlots(id, selectedDate, [], {
        clinicId: doctorQuery.data?.clinicId,
        serviceId: selectedServiceId,
      }),
    staleTime: 15_000,
  });

  const reviewsQuery = useQuery({
    queryKey: ['reviews', 'doctor', id],
    enabled: Boolean(id),
    queryFn: () => getDoctorReviews(id),
    staleTime: 60_000,
  });

  const slots = slotsQuery.data ?? [];

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
  const selectedService =
    doctor.services.find((s) => s.id === selectedServiceId) ?? doctor.services[0];

  function serviceLabel(svc: {
    name: string;
    nameKey?: string;
    names?: Record<string, string>;
  }): string {
    const lang = i18n.language || 'uz';
    if (svc.names?.[lang]) return svc.names[lang];
    if (svc.nameKey) {
      const translated = t(svc.nameKey);
      if (translated !== svc.nameKey) return translated;
    }
    return svc.name;
  }

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
            onPress={() => void toggleDoctor(doctor.id)}
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
              {doctor.services.map((svc) => {
                const active = svc.id === selectedService?.id;
                return (
                  <Pressable
                    key={svc.id}
                    onPress={() => setSelectedServiceId(svc.id)}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      padding: spacing.md,
                      backgroundColor: active ? colors.primaryMuted ?? colors.surface : colors.surface,
                      borderRadius: radius.lg,
                      borderWidth: 1,
                      borderColor: active ? colors.primary : colors.borderSubtle,
                    }}
                  >
                    <Text variant="body">{serviceLabel(svc)}</Text>
                    <Text variant="label" color={colors.primary}>
                      {formatPrice(svc.price)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {(reviewsQuery.data?.length ?? 0) > 0 ? (
            <View>
              <Text variant="h3" style={{ marginBottom: spacing.md }}>
                {t('clinic.reviews')}
              </Text>
              <View style={{ gap: spacing.sm }}>
                {reviewsQuery.data!.slice(0, 3).map((r) => (
                  <View
                    key={r.id}
                    style={{
                      padding: spacing.md,
                      backgroundColor: colors.surface,
                      borderRadius: radius.lg,
                      borderWidth: 1,
                      borderColor: colors.borderSubtle,
                      gap: 4,
                    }}
                  >
                    <Text variant="label">
                      {r.authorName} · ★ {r.rating}
                    </Text>
                    {r.comment ? (
                      <Text variant="bodySmall" muted>
                        {r.comment}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View style={{ gap: spacing.md }}>
            <Text variant="h3">{t('booking.choose_datetime')}</Text>
            <DateStrip
              dates={dates}
              selected={selectedDate}
              onSelect={(d) => {
                setSelectedDate(d);
                setSelectedTime(undefined);
              }}
            />
            {slotsQuery.isLoading ? (
              <ListSkeleton rows={2} />
            ) : (
              <SlotPicker slots={slots} selected={selectedTime} onSelect={setSelectedTime} />
            )}
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
          disabled={!selectedTime || !selectedService}
          onPress={() => {
            if (!selectedService) return;
            setDraft({
              clinicId: doctor.clinicId,
              doctorId: doctor.id,
              serviceId: selectedService.id,
              serviceName: serviceLabel(selectedService),
              price: selectedService.price,
              date: selectedDate,
              time: selectedTime,
              rescheduleAppointmentId: draft.rescheduleAppointmentId,
            });
            router.push('/(client)/booking/confirm');
          }}
        />
      </View>
    </View>
  );
}
