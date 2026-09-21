import { View } from 'react-native';

import { Skeleton } from '@/components/ui/Skeleton';
import { useTheme } from '@/theme';

import type { SearchTab } from './types';

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
      <Skeleton height={132} radius={0} />
      <View style={{ padding: 16, gap: 10 }}>
        <Skeleton width="72%" height={18} />
        <Skeleton width="48%" height={12} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Skeleton width={78} height={22} radius={11} />
          <Skeleton width={92} height={22} radius={11} />
        </View>
        <Skeleton width="36%" height={14} />
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
          <Skeleton height={42} radius={12} style={{ flex: 1 }} />
          <Skeleton height={42} radius={12} style={{ flex: 1.3 }} />
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
        <Skeleton width={72} height={72} radius={36} />
        <View style={{ flex: 1, gap: 8, paddingTop: 4 }}>
          <Skeleton width="70%" height={16} />
          <Skeleton width="46%" height={12} />
          <Skeleton width="58%" height={12} />
        </View>
      </View>
      <Skeleton width="52%" height={12} />
      <Skeleton height={34} radius={12} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Skeleton height={42} radius={12} style={{ flex: 1 }} />
        <Skeleton height={42} radius={12} style={{ flex: 1.3 }} />
      </View>
    </View>
  );
}

export function SearchSkeleton({ tab }: { tab: SearchTab }) {
  return (
    <View style={{ paddingTop: 8, gap: 14 }}>
      {tab === 'clinics'
        ? [0, 1, 2].map((i) => <ClinicSkeleton key={i} />)
        : [0, 1, 2].map((i) => <DoctorSkeleton key={i} />)}
    </View>
  );
}

export function SearchPageSkeleton({ tab }: { tab: SearchTab }) {
  const { spacing } = useTheme();
  return (
    <View style={{ flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: 14 }}>
      <View style={{ gap: 8 }}>
        <Skeleton width="42%" height={28} />
        <Skeleton width="78%" height={14} />
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Skeleton height={56} radius={18} style={{ flex: 1 }} />
        <Skeleton width={56} height={56} radius={18} />
      </View>
      <Skeleton height={52} radius={16} />
      <Skeleton width="44%" height={14} />
      {tab === 'clinics' ? <ClinicSkeleton /> : <DoctorSkeleton />}
      {tab === 'clinics' ? <ClinicSkeleton /> : <DoctorSkeleton />}
    </View>
  );
}
