import { View } from 'react-native';

import { Skeleton } from '@/components/ui/Skeleton';
import { useTheme } from '@/theme';

export function AppointmentSkeleton({ rows = 3 }: { rows?: number }) {
  const { colors, spacing, radius, shadows } = useTheme();

  return (
    <View style={{ gap: spacing.lg, paddingHorizontal: spacing.xl }}>
      {Array.from({ length: rows }).map((_, i) => (
        <View
          key={i}
          style={[
            shadows.sm,
            {
              backgroundColor: colors.surface,
              borderRadius: radius['2xl'],
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              padding: spacing.lg,
              gap: spacing.md,
            },
          ]}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Skeleton width={88} height={22} radius={11} />
            <Skeleton width={96} height={14} radius={7} />
          </View>

          <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
            <Skeleton width={48} height={48} radius={24} />
            <View style={{ flex: 1, gap: 8 }}>
              <Skeleton width="72%" height={15} />
              <Skeleton width="48%" height={12} />
              <Skeleton width="56%" height={12} />
            </View>
          </View>

          <View style={{ gap: 10, paddingTop: 4 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Skeleton width={64} height={12} />
              <Skeleton width={88} height={12} />
            </View>
            <Skeleton width="90%" height={12} />
          </View>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <Skeleton height={40} radius={14} style={{ flex: 1 }} />
            <Skeleton height={40} radius={14} style={{ flex: 1 }} />
          </View>
        </View>
      ))}
    </View>
  );
}
