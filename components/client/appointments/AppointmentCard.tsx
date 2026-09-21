import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

import {
  Building2,
  Calendar,
  Clock,
  MapPin,
  Navigation,
  Stethoscope,
  Wallet,
} from '@/components/icons';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Text } from '@/components/ui/Text';
import { queryKeys } from '@/hooks/queries';
import { cancelAppointment } from '@/services/appointmentService';
import { openGoogleMapsDriving } from '@/services/navigatorLinks';
import { useAppointmentsStore } from '@/store/appointmentsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useToastStore } from '@/store/toastStore';
import { useTheme } from '@/theme';
import type { Appointment } from '@/types';
import { formatPrice } from '@/utils/slots';

import { AppointmentActionRow, type AppointmentAction } from './AppointmentActionRow';
import {
  formatAppointmentDate,
  shortAppointmentRef,
} from './formatAppointmentDate';

type Props = {
  appointment: Appointment;
  clinicCoords?: { latitude: number; longitude: number } | null;
};

export function AppointmentCard({ appointment, clinicCoords }: Props) {
  const { t } = useTranslation();
  const locale = useSettingsStore((s) => s.locale);
  const { colors, spacing, radius, shadows, iconSizes, isDark } = useTheme();
  const queryClient = useQueryClient();
  const setDraft = useAppointmentsStore((s) => s.setDraft);
  const showToast = useToastStore((s) => s.showToast);
  const [cancelling, setCancelling] = useState(false);

  const statusTone =
    appointment.status === 'upcoming'
      ? 'primary'
      : appointment.status === 'completed'
        ? 'success'
        : 'error';

  const accentBar =
    appointment.status === 'upcoming'
      ? colors.primary
      : appointment.status === 'completed'
        ? colors.success
        : '#FB7185';

  const softSurface =
    appointment.status === 'completed'
      ? isDark
        ? 'rgba(22,163,74,0.08)'
        : '#F8FDF9'
      : appointment.status === 'cancelled'
        ? isDark
          ? 'rgba(251,113,133,0.08)'
          : '#FFFCFC'
        : colors.surface;

  const formattedDate = formatAppointmentDate(appointment.date, locale);
  const refCode = shortAppointmentRef(appointment.id);

  const openDetails = () => router.push(`/(client)/appointment/${appointment.id}`);

  const openClinic = () => router.push(`/(client)/clinic/${appointment.clinicId}`);

  const bookAgain = () => {
    setDraft({
      clinicId: appointment.clinicId,
      doctorId: appointment.doctorId,
      serviceId: appointment.serviceId,
      serviceName: appointment.serviceName,
      price: appointment.price,
    });
    router.push(`/(client)/doctor/${appointment.doctorId}`);
  };

  const reschedule = () => {
    setDraft({
      clinicId: appointment.clinicId,
      doctorId: appointment.doctorId,
      serviceId: appointment.serviceId,
      serviceName: appointment.serviceName,
      price: appointment.price,
      rescheduleAppointmentId: appointment.id,
    });
    router.push(`/(client)/doctor/${appointment.doctorId}`);
  };

  const openDirections = () => {
    if (!clinicCoords) return;
    void openGoogleMapsDriving(clinicCoords);
  };

  const confirmCancel = () => {
    Alert.alert(
      t('appointments.cancel_appointment'),
      t('appointments.cancel_confirm'),
      [
        { text: t('common.no'), style: 'cancel' },
        {
          text: t('appointments.cancel_short'),
          style: 'destructive',
          onPress: () => {
            setCancelling(true);
            void (async () => {
              try {
                await cancelAppointment(appointment.id);
                await queryClient.invalidateQueries({
                  queryKey: queryKeys.appointments.all,
                });
                showToast({
                  tone: 'success',
                  title: t('appointments.cancelled_toast_title'),
                  message: t('appointments.cancelled_toast_body'),
                });
              } catch (err) {
                showToast({
                  tone: 'error',
                  title: t('error.something_wrong'),
                  message:
                    err instanceof Error
                      ? err.message
                      : t('appointments.cancel_failed'),
                });
              } finally {
                setCancelling(false);
              }
            })();
          },
        },
      ],
    );
  };

  const actions: AppointmentAction[] = (() => {
    if (appointment.status === 'upcoming') {
      const list: AppointmentAction[] = [
        {
          key: 'details',
          label: t('appointments.details'),
          onPress: openDetails,
          tone: 'primary',
        },
      ];
      if (clinicCoords) {
        list.push({
          key: 'directions',
          label: t('appointments.directions'),
          onPress: openDirections,
          icon: Navigation,
          tone: 'default',
        });
      }
      list.push({
        key: 'reschedule',
        label: t('appointments.reschedule'),
        onPress: reschedule,
        tone: 'muted',
      });
      list.push({
        key: 'cancel',
        label: t('appointments.cancel_short'),
        onPress: confirmCancel,
        tone: 'danger',
        loading: cancelling,
      });
      return list;
    }

    if (appointment.status === 'completed') {
      return [
        {
          key: 'book_again',
          label: t('appointments.book_again'),
          onPress: bookAgain,
          tone: 'primary',
        },
        {
          key: 'clinic',
          label: t('appointments.view_clinic'),
          onPress: openClinic,
          tone: 'default',
        },
        {
          key: 'details',
          label: t('appointments.details'),
          onPress: openDetails,
          tone: 'muted',
        },
      ];
    }

    return [
      {
        key: 'book_again',
        label: t('appointments.book_again'),
        onPress: bookAgain,
        tone: 'primary',
      },
      {
        key: 'details',
        label: t('appointments.details'),
        onPress: openDetails,
        tone: 'muted',
      },
    ];
  })();

  return (
    <View
      style={[
        shadows.md,
        {
          backgroundColor: softSurface,
          borderRadius: radius['2xl'],
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          overflow: 'hidden',
        },
      ]}
    >
      <View style={{ flexDirection: 'row' }}>
        <View
          style={{
            width: 4,
            backgroundColor: accentBar,
            opacity: appointment.status === 'cancelled' ? 0.55 : 1,
          }}
        />
        <View style={{ flex: 1, padding: spacing.lg, gap: spacing.md }}>
          <Pressable onPress={openDetails}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: spacing.sm,
                marginBottom: spacing.md,
              }}
            >
              <Badge
                label={t(`appointments.status_${appointment.status}`)}
                tone={statusTone}
              />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Calendar size={iconSizes.xs} color={colors.textMuted} strokeWidth={1.8} />
                <Text variant="caption" color={colors.textSecondary}>
                  {formattedDate}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
              <Avatar name={appointment.doctorName} size={48} />
              <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Building2 size={14} color={colors.primary} strokeWidth={1.9} />
                  <Text variant="label" numberOfLines={2} style={{ flex: 1, fontSize: 15 }}>
                    {appointment.clinicName}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Stethoscope size={13} color={colors.textMuted} strokeWidth={1.8} />
                  <Text variant="bodySmall" muted numberOfLines={1} style={{ flex: 1 }}>
                    {appointment.doctorName}
                  </Text>
                </View>
                <Text
                  variant="caption"
                  color={colors.primary}
                  numberOfLines={2}
                  style={{ marginTop: 2 }}
                >
                  {appointment.serviceName}
                </Text>
              </View>
            </View>

            <View
              style={{
                gap: spacing.sm,
                paddingTop: spacing.md,
                marginTop: spacing.md,
                borderTopWidth: 1,
                borderTopColor: colors.borderSubtle,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: spacing.md,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Clock size={iconSizes.xs} color={colors.textMuted} strokeWidth={1.8} />
                  <Text variant="caption" color={colors.textSecondary}>
                    {appointment.time}
                  </Text>
                </View>
                {appointment.price > 0 ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Wallet size={iconSizes.xs} color={colors.primary} strokeWidth={1.8} />
                    <Text variant="caption" color={colors.primary} weight="semibold">
                      {formatPrice(appointment.price)} {t('common.currency')}
                    </Text>
                  </View>
                ) : null}
                <Text variant="caption" muted>
                  {t('appointments.ref', { id: refCode })}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                <MapPin size={iconSizes.xs} color={colors.textMuted} strokeWidth={1.8} />
                <Text
                  variant="caption"
                  muted
                  numberOfLines={2}
                  style={{ flex: 1, lineHeight: 17 }}
                >
                  {appointment.clinicAddress}
                </Text>
              </View>

              {appointment.status === 'cancelled' && appointment.notes ? (
                <Text variant="caption" muted numberOfLines={2} style={{ lineHeight: 17 }}>
                  {appointment.notes}
                </Text>
              ) : null}
            </View>
          </Pressable>

          <AppointmentActionRow actions={actions} />
        </View>
      </View>
    </View>
  );
}
