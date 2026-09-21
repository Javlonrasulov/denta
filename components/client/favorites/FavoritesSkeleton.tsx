import { View } from 'react-native';

import { Skeleton } from '@/components/ui/Skeleton';
import { useTheme } from '@/theme';

import type { FavoritesTab } from './FavoritesSegmented';

function ClinicSkeleton() {
  const { colors, shadows } = useTheme();
  return (
    <View
      style={[
        shadows.sm,
        {
          backgroundColor: colors.surface,
          borderRadius: 22,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.borderSubtle,
        },
      ]}
    >
      <Skeleton height={148} radius={0} />
      <View style={{ padding: 16, gap: 10 }}>
        <Skeleton width="74%" height={18} />
        <Skeleton width="52%" height={12} />
        <Skeleton width="88%" height={12} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Skeleton width={78} height={22} radius={11} />
          <Skeleton width={92} height={22} radius={11} />
          <Skeleton width={64} height={22} radius={11} />
        </View>
        <Skeleton width="40%" height={14} />
        <Skeleton height={34} radius={12} />
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
          <Skeleton height={44} radius={14} style={{ flex: 1 }} />
          <Skeleton height={44} radius={14} style={{ flex: 1.35 }} />
        </View>
      </View>
    </View>
  );
}

function DoctorSkeleton() {
  const { colors, shadows } = useTheme();
  return (
    <View
      style={[
        shadows.sm,
        {
          backgroundColor: colors.surface,
          borderRadius: 22,
          padding: 16,
          gap: 12,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
        },
      ]}
    >
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Skeleton width={76} height={76} radius={38} />
        <View style={{ flex: 1, gap: 8, paddingTop: 4 }}>
          <Skeleton width="78%" height={16} />
          <Skeleton width="48%" height={12} />
          <Skeleton width="62%" height={12} />
        </View>
        <Skeleton width={44} height={44} radius={22} />
      </View>
      <Skeleton width="54%" height={12} />
      <Skeleton height={36} radius={12} />
      <Skeleton width="38%" height={14} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Skeleton height={44} radius={14} style={{ flex: 1 }} />
        <Skeleton height={44} radius={14} style={{ flex: 1.35 }} />
      </View>
    </View>
  );
}

export function FavoritesSkeleton({ tab }: { tab: FavoritesTab }) {
  return (
    <View style={{ paddingTop: 4, gap: 14 }}>
      {tab === 'clinics'
        ? [0, 1].map((i) => <ClinicSkeleton key={i} />)
        : [0, 1, 2].map((i) => <DoctorSkeleton key={i} />)}
    </View>
  );
}
