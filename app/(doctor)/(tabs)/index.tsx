import { router } from 'expo-router';
import { CalendarPlus, Clock, UserPlus } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui/Text';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { useAppointments, useDoctorStats } from '@/hooks/queries';
import { useTheme } from '@/theme';
import { formatPrice } from '@/utils/slots';

export default function DoctorDashboardScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius, shadows } = useTheme();
  const stats = useDoctorStats();
  const appointments = useAppointments('upcoming');

  const today = appointments.data?.filter((a) => a.date === '2026-08-23') ?? [];

  if (stats.isLoading) return <ListSkeleton rows={6} />;

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
      <Text variant="h1">{t('tabs.dashboard')}</Text>
      <Text variant="body" muted>
        {t('doctor_app.todays_appointments')}
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
        {[
          { label: t('doctor_app.todays_patients'), value: String(stats.data?.patients ?? 0) },
          { label: t('doctor_app.completed'), value: String(stats.data?.completed ?? 0) },
          { label: t('doctor_app.upcoming'), value: String(stats.data?.upcoming ?? 0) },
          {
            label: t('doctor_app.todays_income'),
            value: formatPrice(stats.data?.income ?? 0),
          },
        ].map((item) => (
          <View
            key={item.label}
            style={{
              width: '47%',
              backgroundColor: colors.surface,
              borderRadius: radius.xl,
              padding: spacing.lg,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              ...shadows.sm,
              gap: spacing.xs,
            }}
          >
            <Text variant="caption" muted>
              {item.label}
            </Text>
            <Text variant="h2">{item.value}</Text>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {[
          { icon: UserPlus, label: t('doctor_app.add_patient') },
          { icon: CalendarPlus, label: t('doctor_app.add_appointment') },
          { icon: Clock, label: t('doctor_app.manage_schedule') },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <Pressable
              key={action.label}
              style={{
                flex: 1,
                backgroundColor: colors.primaryMuted,
                borderRadius: radius.lg,
                padding: spacing.md,
                alignItems: 'center',
                gap: spacing.xs,
              }}
            >
              <Icon size={18} color={colors.primary} />
              <Text variant="caption" color={colors.primary} center>
                {action.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ gap: spacing.md }}>
        <Text variant="h3">{t('doctor_app.todays_appointments')}</Text>
        {today.length === 0 ? (
          <Text muted>{t('appointments.no_upcoming')}</Text>
        ) : (
          today.map((apt) => (
            <Pressable
              key={apt.id}
              onPress={() => router.push(`/(client)/appointment/${apt.id}`)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                backgroundColor: colors.surface,
                borderRadius: radius.lg,
                padding: spacing.lg,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              }}
            >
              <View
                style={{
                  width: 56,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text variant="label" color={colors.primary}>
                  {apt.time}
                </Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="h3" style={{ fontSize: 16 }}>
                  {apt.patientName}
                </Text>
                <Text variant="bodySmall" muted>
                  {apt.serviceName}
                </Text>
              </View>
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}
