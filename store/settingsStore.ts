import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { APP_VARIANT } from '@/constants/appVariant';
import { LocaleCode, UserRole } from '@/types';
import { zustandStorage } from '@/utils/storage';

type ThemeMode = 'light' | 'dark' | 'system';
export type UiFontSize = 'sm' | 'md' | 'lg' | 'xl';

interface SettingsState {
  locale: LocaleCode;
  themeMode: ThemeMode;
  fontSize: UiFontSize;
  notificationsEnabled: boolean;
  sidebarCollapsed: boolean;
  role: UserRole | null;
  isAuthenticated: boolean;
  adminName: string;
  adminLogin: string;
  adminPassword: string;
  setLocale: (locale: LocaleCode) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setFontSize: (size: UiFontSize) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setRole: (role: UserRole | null) => void;
  login: (payload: { name?: string; login: string; password: string }) => void;
  updateCredentials: (payload: {
    login?: string;
    currentPassword: string;
    newPassword?: string;
  }) => { ok: true } | { ok: false; error: 'wrong_password' | 'weak_password' };
  logout: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      locale: 'uz',
      themeMode: 'light',
      fontSize: 'md',
      notificationsEnabled: true,
      sidebarCollapsed: false,
      role: null,
      isAuthenticated: false,
      adminName: 'Admin',
      adminLogin: 'admin@denta.uz',
      adminPassword: '',
      setLocale: (locale) => set({ locale }),
      setThemeMode: (themeMode) => set({ themeMode }),
      setFontSize: (fontSize) => set({ fontSize }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      toggleSidebarCollapsed: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setRole: (role) => set({ role }),
      login: ({ name = 'Admin', login, password }) =>
        set({
          isAuthenticated: true,
          adminName: name,
          adminLogin: login,
          adminPassword: password,
        }),
      updateCredentials: ({ login, currentPassword, newPassword }) => {
        const state = get();
        if (state.adminPassword && state.adminPassword !== currentPassword) {
          return { ok: false, error: 'wrong_password' };
        }
        if (newPassword !== undefined && newPassword.length > 0 && newPassword.length < 4) {
          return { ok: false, error: 'weak_password' };
        }
        const nextLogin = login?.trim() || state.adminLogin;
        const nextName = nextLogin.includes('@')
          ? nextLogin.split('@')[0]
          : nextLogin || state.adminName;
        set({
          adminLogin: nextLogin,
          adminName: nextName.charAt(0).toUpperCase() + nextName.slice(1),
          adminPassword: newPassword && newPassword.length > 0 ? newPassword : state.adminPassword,
        });
        return { ok: true };
      },
      logout: () =>
        set({
          isAuthenticated: false,
          role: null,
          adminName: 'Admin',
        }),
    }),
    {
      name: `denta-settings-${APP_VARIANT}`,
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
