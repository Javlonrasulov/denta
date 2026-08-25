import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { LocaleCode, UserRole } from '@/types';
import { zustandStorage } from '@/utils/storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface SettingsState {
  locale: LocaleCode;
  themeMode: ThemeMode;
  notificationsEnabled: boolean;
  role: UserRole | null;
  setLocale: (locale: LocaleCode) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setRole: (role: UserRole | null) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      locale: 'uz',
      themeMode: 'system',
      notificationsEnabled: true,
      role: null,
      setLocale: (locale) => set({ locale }),
      setThemeMode: (themeMode) => set({ themeMode }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setRole: (role) => set({ role }),
    }),
    {
      name: 'denta-settings',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
