import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { Skeleton } from '@/components/ui/Skeleton';

function TimelineRow() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, height: 56 }}>
      <Skeleton width={40} height={12} />
      <Skeleton width={10} height={10} radius={5} />
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton width="58%" height={14} />
        <Skeleton width={72} height={18} radius={8} />
      </View>
    </View>
  );
}

export function DashboardSkeleton() {
  const { canvas, hairline } = useLoginTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: canvas,
        paddingTop: insets.top + 12,
        paddingHorizontal: 20,
        paddingBottom: 24,
        gap: 20,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1, gap: 8 }}>
          <Skeleton width="38%" height={13} />
          <Skeleton width="62%" height={26} />
          <Skeleton width="74%" height={13} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Skeleton width={44} height={44} radius={22} />
          <Skeleton width={44} height={44} radius={22} />
        </View>
      </View>

      <Skeleton height={196} radius={22} />

      <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
        <Skeleton width={72} height={72} radius={36} />
        <View style={{ flex: 1, gap: 10 }}>
          <Skeleton width="70%" height={13} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Skeleton height={36} radius={10} style={{ flex: 1 }} />
            <Skeleton height={36} radius={10} style={{ flex: 1 }} />
            <Skeleton height={36} radius={10} style={{ flex: 1 }} />
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Skeleton height={84} radius={16} style={{ flex: 1 }} />
        <View style={{ width: 1, backgroundColor: hairline }} />
        <Skeleton height={84} radius={16} style={{ flex: 1 }} />
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center', gap: 8 }}>
            <Skeleton width={52} height={52} radius={16} />
            <Skeleton width="78%" height={11} />
          </View>
        ))}
      </View>

      <View style={{ gap: 8, flex: 1 }}>
        <Skeleton width="44%" height={18} />
        <TimelineRow />
        <TimelineRow />
        <TimelineRow />
        <TimelineRow />
        <TimelineRow />
        <TimelineRow />
      </View>
    </View>
  );
}