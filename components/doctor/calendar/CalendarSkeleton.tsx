import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { Skeleton } from '@/components/ui/Skeleton';

export function CalendarSkeleton() {
  const { canvas, hairline } = useLoginTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: canvas,
        paddingTop: insets.top + 8,
        paddingHorizontal: 20,
        paddingBottom: 24,
        gap: 18,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1, gap: 8 }}>
          <Skeleton width="42%" height={28} />
          <Skeleton width="68%" height={14} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Skeleton width={44} height={44} radius={22} />
          <Skeleton width={44} height={44} radius={22} />
        </View>
      </View>

      <Skeleton height={44} radius={16} />

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} width={52} height={72} radius={18} />
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Skeleton width={88} height={34} radius={17} />
        <Skeleton width={110} height={34} radius={17} />
        <Skeleton width={120} height={34} radius={17} />
      </View>

      <Skeleton height={108} radius={20} />

      <View style={{ gap: 10, flex: 1 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Skeleton width={40} height={12} />
            <View style={{ width: 1, height: 56, backgroundColor: hairline }} />
            <Skeleton height={i === 2 ? 88 : 56} radius={16} style={{ flex: 1 }} />
          </View>
        ))}
      </View>
    </View>
  );
}
