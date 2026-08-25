import React from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, MapPin } from 'lucide-react-native';

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
  const { colors, spacing, radius, shadows, iconSizes } = useTheme();

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
          ...shadows.sm,
        },
      ]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 }}>
          <Avatar name={appointment.doctorName} size={48} />
          <View style={{ flex: 1 }}>
            <Text variant="h3" numberOfLines={1} style={{ fontSize: 16 }}>
              {appointment.doctorName}
            </Text>
            <Text variant="bodySmall" muted numberOfLines={1}>
              {appointment.clinicName}
            </Text>
          </View>
        </View>
        <Badge label={statusLabel} tone={tone} />
      </View>

      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Calendar size={iconSizes.xs} color={colors.textMuted} />
          <Text variant="bodySmall">{appointment.date}</Text>
          <Clock size={iconSizes.xs} color={colors.textMuted} />
          <Text variant="bodySmall">{appointment.time}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <MapPin size={iconSizes.xs} color={colors.textMuted} />
          <Text variant="bodySmall" muted numberOfLines={1} style={{ flex: 1 }}>
            {appointment.clinicAddress}
          </Text>
        </View>
        <Text variant="caption" color={colors.primary}>
          {appointment.serviceName}
        </Text>
      </View>
    </Pressable>
  );
}
