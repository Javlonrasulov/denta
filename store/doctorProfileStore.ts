import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { APP_VARIANT } from '@/constants/appVariant';
import type {
  DoctorNotificationKey,
  DoctorNotificationSettings,
  UpdateDoctorProfileInput,
} from '@/types';
import { DEFAULT_NOTIFICATION_SETTINGS } from '@/utils/doctorProfile';
import { zustandStorage } from '@/utils/storage';

interface DoctorProfileState {
  overrides: UpdateDoctorProfileInput;
  notificationSettings: DoctorNotificationSettings;
  biometricEnabled: boolean;
  privacyVisibleToClinic: boolean;
  privacyVisibleInSearch: boolean;
  privacyAnalytics: boolean;
  patchProfile: (patch: UpdateDoctorProfileInput) => void;
  setNotification: (key: DoctorNotificationKey, value: boolean) => void;
  setBiometricEnabled: (enabled: boolean) => void;
  setPrivacy: (
    patch: Partial<
      Pick<DoctorProfileState, 'privacyVisibleToClinic' | 'privacyVisibleInSearch' | 'privacyAnalytics'>
    >,
  ) => void;
}

export const useDoctorProfileStore = create<DoctorProfileState>()(
  persist(
    (set) => ({
      overrides: {},
      notificationSettings: DEFAULT_NOTIFICATION_SETTINGS,
      biometricEnabled: false,
      privacyVisibleToClinic: true,
      privacyVisibleInSearch: true,
      privacyAnalytics: false,
      patchProfile: (patch) =>
        set((state) => ({
          overrides: { ...state.overrides, ...patch },
        })),
      setNotification: (key, value) =>
        set((state) => ({
          notificationSettings: { ...state.notificationSettings, [key]: value },
        })),
      setBiometricEnabled: (biometricEnabled) => set({ biometricEnabled }),
      setPrivacy: (patch) => set(patch),
    }),
    {
      name: `denta-doctor-profile-${APP_VARIANT}`,
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
