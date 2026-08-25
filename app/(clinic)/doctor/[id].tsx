import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from '@/components/icons';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ErrorState } from '@/components/states/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useDoctor } from '@/hooks/queries';
import { useTheme } from '@/theme';
import { formatPrice } from '@/utils/slots';

export default function ClinicDoctorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius, shadows } = useTheme();
  const doctor = useDoctor(id);

  if (doctor.isLoading) return <ListSkeleton rows={5} />;
  if (!doctor.data) {
    return (
      <ErrorState
        title={t('error.something_wrong')}
        onRetry={() => doctor.refetch()}
        retryLabel={t('common.retry')}
      />
    );
  }

  const d = doctor.data;

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
      <Pressable onPress={() => router.back()} hitSlop={8} style={{ width: 44, height: 44, justifyContent: 'center' }}>
        <ArrowLeft size={22} color={colors.text} />
      </Pressable>

      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          padding: spacing.xl,
          alignItems: 'center',
          gap: spacing.md,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          ...shadows.sm,
        }}
      >
        <Avatar uri={d.photoUrl} name={d.fullName} size={88} />
        <Text variant="h1" center style={{ fontSize: 22 }}>
          {d.fullName}
        </Text>
        <Text variant="body" color={colors.secondary} center>
          {d.specialization}
        </Text>
        <Text variant="bodySmall" muted center>
          ★ {d.rating.toFixed(1)} · {t('doctor.experience_years', { years: d.experienceYears })}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
        {[
          { label: t('crm.doctors.patients'), value: String(d.reviewCount) },
          { label: t('crm.doctors.today_apts'), value: '8' },
          { label: t('crm.doctors.revenue'), value: formatPrice(d.priceFrom * 40) },
          { label: t('crm.doctors.rating'), value: d.rating.toFixed(1) },
        ].map((s) => (
          <View
            key={s.label}
            style={{
              flexGrow: 1,
              minWidth: 140,
              padding: spacing.lg,
              borderRadius: radius.lg,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              gap: 4,
            }}
          >
            <Text variant="caption" muted>
              {s.label}
            </Text>
            <Text variant="h3">{s.value}</Text>
          </View>
        ))}
      </View>

      <Text variant="h3">{t('doctor.about')}</Text>
      <Text variant="body" muted>
        {d.bio}
      </Text>
    </ScrollView>
  );
}
