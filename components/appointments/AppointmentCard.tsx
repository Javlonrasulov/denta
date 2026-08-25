import React from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, MapPin } from '@/components/icons';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';
import { Appointment } from '@/types';

interface AppointmentCardProps {
  appointment: Appointment;
  onPress?: () => void;
}

export function AppointmentCard({ appointment, onPress }: AppointmentCardProps) {
  const { t } = useTranslation();
  const { colors, spacing, radius, iconSizes } = useTheme();

  const tone =
    appointment.status === 'upcoming'
      ? 'primary'
      : appointment.status === 'completed'
        ? 'success'
        : 'neutral';

  const statusLabel =
    appointment.status === 'upcoming'
      ? t('appointments.status_upcoming')
      : appointment.status === 'completed'
        ? t('appointments.status_completed')
        : t('appointments.status_cancelled');

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          padding: spacing.lg,
          gap: spacing.md,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          opacity: pressed ? 0.94 : 1,
        },
      ]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1, minWidth: 0 }}>
          <Avatar name={appointment.doctorName} size={44} />
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text variant="label" numberOfLines={1} style={{ fontSize: 15 }}>
              {appointment.doctorName}
            </Text>
            <Text variant="caption" muted numberOfLines={1}>
              {appointment.clinicName}
            </Text>
          </View>
        </View>
        <Badge label={statusLabel} tone={tone} />
      </View>

      <View
        style={{
          gap: spacing.sm,
          paddingTop: spacing.sm,
          borderTopWidth: 1,
          borderTopColor: colors.borderSubtle,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Calendar size={iconSizes.xs} color={colors.textMuted} strokeWidth={1.8} />
            <Text variant="caption">{appointment.date}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Clock size={iconSizes.xs} color={colors.textMuted} strokeWidth={1.8} />
            <Text variant="caption">{appointment.time}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MapPin size={iconSizes.xs} color={colors.textMuted} strokeWidth={1.8} />
          <Text variant="caption" muted numberOfLines={1} style={{ flex: 1 }}>
            {appointment.clinicAddress}
          </Text>
        </View>
        <Text variant="caption" weight="semibold" color={colors.primary}>
          {appointment.serviceName}
        </Text>
      </View>
    </Pressable>
  );
}
