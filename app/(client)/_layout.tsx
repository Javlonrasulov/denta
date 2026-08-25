import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

export default function ClientLayout() {
  const { colors } = useTheme();

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
