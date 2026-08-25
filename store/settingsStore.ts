import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { LocaleCode, UserRole } from '@/types';
import { zustandStorage } from '@/utils/storage';

type ThemeMode = 'light' | 'dark' | 'system';
export type UiFontSize = 'sm' | 'md' | 'lg' | 'xl';

interface SettingsState {
  locale: LocaleCode;
  themeMode: ThemeMode;
  fontSize: UiFontSize;
  notificationsEnabled: boolean;
  role: UserRole | null;
  isAuthenticated: boolean;
  adminName: string;
  setLocale: (locale: LocaleCode) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setFontSize: (size: UiFontSize) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setRole: (role: UserRole | null) => void;
  login: (adminName?: string) => void;
  logout: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      locale: 'uz',
      themeMode: 'light',
      fontSize: 'md',
      notificationsEnabled: true,
      role: null,
      isAuthenticated: false,
      adminName: 'Admin',
      setLocale: (locale) => set({ locale }),
      setThemeMode: (themeMode) => set({ themeMode }),
      setFontSize: (fontSize) => set({ fontSize }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setRole: (role) => set({ role }),
      login: (adminName = 'Admin') => set({ isAuthenticated: true, adminName }),
      logout: () => set({ isAuthenticated: false, role: null, adminName: 'Admin' }),
    }),
    {
      name: 'denta-settings',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
