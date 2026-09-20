import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { Skeleton } from '@/components/ui/Skeleton';

export function PatientsSkeleton() {
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
          <Skeleton width="44%" height={28} />
          <Skeleton width="36%" height={14} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Skeleton width={44} height={44} radius={22} />
          <Skeleton width={44} height={44} radius={22} />
        </View>
      </View>

      <Skeleton height={52} radius={16} />
      <Skeleton height={48} radius={16} />

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Skeleton width={72} height={32} radius={16} />
        <Skeleton width={68} height={32} radius={16} />
        <Skeleton width={104} height={32} radius={16} />
        <Skeleton width={78} height={32} radius={16} />
      </View>

      {Array.from({ length: 6 }).map((_, i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            gap: 12,
            alignItems: 'center',
            paddingVertical: 8,
            borderBottomWidth: i === 5 ? 0 : 1,
            borderBottomColor: hairline,
          }}
        >
          <Skeleton width={46} height={46} radius={23} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton width="62%" height={14} />
            <Skeleton width="48%" height={11} />
            <Skeleton width="78%" height={11} />
          </View>
        </View>
      ))}
    </View>
  );
}
