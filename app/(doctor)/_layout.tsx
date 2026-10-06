import { useState } from 'react';
import { Redirect, Stack } from 'expo-router';

import { ChangePasswordSheet } from '@/components/doctor/profile/ChangePasswordSheet';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/theme';

export default function DoctorLayout() {
  const { colors } = useTheme();
  const isAuthenticated = useSettingsStore((s) => s.isAuthenticated);
  const mustChangePassword = useSettingsStore((s) => s.mustChangePassword);
  const [passwordPromptDismissed, setPasswordPromptDismissed] = useState(false);

  if (!isAuthenticated) return <Redirect href="/login" />;

  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="patient/[id]" options={{ animation: 'slide_from_right' }} />
      </Stack>
      <ChangePasswordSheet
        forced
        visible={mustChangePassword && !passwordPromptDismissed}
        onClose={() => setPasswordPromptDismissed(true)}
      />
    </>
  );
}
