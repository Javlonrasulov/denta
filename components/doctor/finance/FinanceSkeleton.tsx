import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { Skeleton } from '@/components/ui/Skeleton';

export function FinanceSkeleton() {
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
        gap: 16,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1, gap: 8 }}>
          <Skeleton width="42%" height={28} />
          <Skeleton width="58%" height={14} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Skeleton width={44} height={44} radius={22} />
          <Skeleton width={44} height={44} radius={22} />
        </View>
      </View>

      <Skeleton height={40} radius={16} />
      <Skeleton height={220} radius={22} />
      <Skeleton height={180} radius={20} />
      <Skeleton height={150} radius={20} />

      {Array.from({ length: 4 }).map((_, index) => (
        <View
          key={index}
          style={{
            gap: 8,
            paddingVertical: 10,
            borderBottomWidth: index === 3 ? 0 : 1,
            borderBottomColor: hairline,
          }}
        >
          <Skeleton width="62%" height={14} />
          <Skeleton width="40%" height={11} />
          <Skeleton width="78%" height={11} />
        </View>
      ))}
    </View>
  );
}
