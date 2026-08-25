import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

export default function ClinicShellLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="overview" />
      <Stack.Screen name="appointments" />
      <Stack.Screen name="patients" />
      <Stack.Screen name="doctors" />
      <Stack.Screen name="rooms" />
      <Stack.Screen name="services" />
      <Stack.Screen name="finance" />
      <Stack.Screen name="inventory" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
