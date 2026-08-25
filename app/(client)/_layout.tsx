import { Redirect, Stack } from 'expo-router';

import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/theme';

export default function ClientLayout() {
  const { colors } = useTheme();
  const isAuthenticated = useSettingsStore((s) => s.isAuthenticated);

  if (!isAuthenticated) return <Redirect href="/login" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="clinic/[id]" />
      <Stack.Screen name="doctor/[id]" />
      <Stack.Screen name="booking/index" />
      <Stack.Screen name="booking/confirm" />
      <Stack.Screen name="booking/success" options={{ gestureEnabled: false }} />
      <Stack.Screen name="appointment/[id]" />
      <Stack.Screen name="map" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
