import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from '@/components/icons';

import { DoctorCard } from '@/components/doctor/DoctorCard';
import { Text } from '@/components/ui/Text';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { useDoctors } from '@/hooks/queries';
import { useAppointmentsStore } from '@/store/appointmentsStore';
import { useTheme } from '@/theme';

export default function BookingChooseDoctorScreen() {
  const { clinicId } = useLocalSearchParams<{ clinicId?: string }>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, spacing } = useTheme();
  const doctors = useDoctors({ clinicId });
  const setDraft = useAppointmentsStore((s) => s.setDraft);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.md,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <Text variant="h2">{t('booking.choose_doctor')}</Text>
      </View>

      {doctors.isLoading ? (
        <ListSkeleton rows={5} />
      ) : (
        <FlatList
          data={doctors.data}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}
          renderItem={({ item }) => (
            <DoctorCard
              doctor={item}
              onPress={() => {
                setDraft({ clinicId: item.clinicId, doctorId: item.id });
                router.push(`/(client)/doctor/${item.id}`);
              }}
            />
          )}
        />
      )}
    </View>
  );
}
