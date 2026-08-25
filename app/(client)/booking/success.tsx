import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useAppointmentsStore } from '@/store/appointmentsStore';
import { useClinic, useDoctor } from '@/hooks/queries';
import { useTheme } from '@/theme';

export default function BookingSuccessScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius } = useTheme();
  const draft = useAppointmentsStore((s) => s.draft);
  const clearDraft = useAppointmentsStore((s) => s.clearDraft);
  const doctor = useDoctor(draft.doctorId ?? '');
  const clinic = useClinic(draft.clinicId ?? '');

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: insets.top + spacing['4xl'],
        paddingHorizontal: spacing['2xl'],
        paddingBottom: insets.bottom + spacing.xl,
        alignItems: 'center',
      }}
    >
      <Animated.View
        entering={ZoomIn.springify().damping(14)}
        style={{
          width: 88,
          height: 88,
          borderRadius: 44,
          backgroundColor: colors.successMuted,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing['2xl'],
        }}
      >
        <Check size={40} color={colors.success} strokeWidth={2.5} />
      </Animated.View>

      <Animated.View entering={FadeIn.delay(200)} style={{ alignItems: 'center', gap: spacing.sm }}>
        <Text variant="h1" center>
          {t('booking.success_title')}
        </Text>
        <Text variant="body" muted center>
          {t('booking.success_subtitle')}
        </Text>
      </Animated.View>

      <View
        style={{
          marginTop: spacing['3xl'],
          width: '100%',
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          padding: spacing.xl,
          gap: spacing.sm,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
        }}
      >
        <Text variant="h3">{doctor.data?.fullName}</Text>
        <Text variant="bodySmall" muted>
          {clinic.data?.name}
        </Text>
        <Text variant="body">
          {draft.date} · {draft.time}
        </Text>
        <Text variant="bodySmall" muted>
          {clinic.data?.address}
        </Text>
      </View>

      <View style={{ flex: 1 }} />
      <View style={{ width: '100%', gap: spacing.md }}>
        <Button title={t('booking.add_to_calendar')} variant="outline" fullWidth onPress={() => undefined} />
        <Button
          title={t('tabs.appointments')}
          fullWidth
          onPress={() => {
            clearDraft();
            router.replace('/(client)/(tabs)/appointments');
          }}
        />
      </View>
    </View>
  );
}
