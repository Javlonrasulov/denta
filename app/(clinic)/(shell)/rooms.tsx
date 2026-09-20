import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { AppShell } from '@/components/layout/AppShell';
import { Text } from '@/components/ui/Text';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { apiGet, useMockApi } from '@/services/apiClient';
import { MOCK_ROOMS } from '@/mocks/data';
import { useTheme } from '@/theme';
import type { Room } from '@/types';

export default function ClinicRoomsScreen() {
  const { t } = useTranslation();
  const { colors, spacing, radius } = useTheme();
  const roomsQuery = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      if (useMockApi()) return MOCK_ROOMS;
      return apiGet<Room[]>('/rooms');
    },
  });

  if (roomsQuery.isLoading) return <ListSkeleton rows={4} />;
  const rooms = roomsQuery.data ?? [];

  return (
    <AppShell title={t('crm.nav.rooms')}>
      <View style={{ gap: spacing.md }}>
        {rooms.length === 0 ? (
          <Text variant="body" muted>
            {t('empty.no_data')}
          </Text>
        ) : (
          rooms.map((room) => (
            <View
              key={room.id}
              style={{
                padding: spacing.lg,
                borderRadius: radius.lg,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                gap: 4,
              }}
            >
              <Text variant="label">
                {room.name} · #{room.number}
              </Text>
              <Text variant="bodySmall" muted>
                {room.doctorName ?? '—'} · {room.status}
              </Text>
            </View>
          ))
        )}
      </View>
    </AppShell>
  );
}
