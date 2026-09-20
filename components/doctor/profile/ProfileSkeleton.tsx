import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { Skeleton } from '@/components/ui/Skeleton';

export function ProfileSkeleton() {
  const insets = useSafeAreaInsets();
  const { canvas } = useLoginTheme();

  return (
    <View style={{ flex: 1, backgroundColor: canvas, paddingTop: insets.top + 12, paddingHorizontal: 20, gap: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Skeleton width={140} height={28} radius={8} />
        <Skeleton width={88} height={40} radius={20} />
      </View>
      <Skeleton height={250} radius={24} />
      <Skeleton height={64} radius={18} />
      <Skeleton height={120} radius={20} />
      <Skeleton height={220} radius={20} />
    </View>
  );
}
