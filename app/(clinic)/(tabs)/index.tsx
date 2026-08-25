import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ListSkeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useClinicStats } from '@/hooks/queries';
import { MOCK_ROOMS } from '@/mocks/data';
import { useTheme } from '@/theme';
import { formatPrice } from '@/utils/slots';

export default function ClinicDashboardScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius, shadows } = useTheme();
  const stats = useClinicStats();

  if (stats.isLoading) return <ListSkeleton rows={6} />;

  const cards = [
    { label: t('clinic_crm.todays_revenue'), value: formatPrice(stats.data?.revenue ?? 0) },
    { label: t('clinic_crm.todays_appointments'), value: String(stats.data?.appointments ?? 0) },
    { label: t('clinic_crm.patients'), value: String(stats.data?.patients ?? 0) },
    { label: t('clinic_crm.doctors'), value: String(stats.data?.doctors ?? 0) },
    { label: t('clinic_crm.available_rooms'), value: String(stats.data?.availableRooms ?? 0) },
    { label: t('clinic_crm.cancelled'), value: String(stats.data?.cancelled ?? 0) },
  ];

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

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
        {cards.map((card) => (
          <View
            key={card.label}
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
              {card.label}
            </Text>
            <Text variant="h3">{card.value}</Text>
          </View>
        ))}
      </View>

      <Text variant="h3">{t('clinic_crm.rooms')}</Text>
      {MOCK_ROOMS.map((room) => (
        <View
          key={room.id}
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            padding: spacing.lg,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View>
            <Text variant="body">{room.name}</Text>
            <Text variant="caption" muted>
              #{room.number}
              {room.doctorName ? ` · ${room.doctorName}` : ''}
            </Text>
          </View>
          <Text
            variant="caption"
            color={
              room.status === 'available'
                ? colors.success
                : room.status === 'occupied'
                  ? colors.warning
                  : colors.textMuted
            }
          >
            {room.status}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}
