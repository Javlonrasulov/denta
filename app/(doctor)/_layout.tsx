import { Redirect, Stack } from 'expo-router';

import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/theme';

export default function DoctorLayout() {
  const { colors } = useTheme();
  const isAuthenticated = useSettingsStore((s) => s.isAuthenticated);

  if (!isAuthenticated) return <Redirect href="/login" />;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="patient/[id]" />
    </Stack>
  );
}
