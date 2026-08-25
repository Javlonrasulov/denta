import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

export default function DoctorLayout() {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="patient/[id]" />
    </Stack>
  );
}
