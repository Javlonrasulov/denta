import { create } from 'zustand';

import {
  CURRENT_USER,
  MOCK_FAVORITE_CLINIC_IDS,
  MOCK_FAVORITE_DOCTOR_IDS,
} from '@/mocks/data';

interface FavoritesState {
  clinicIds: string[];
  doctorIds: string[];
  toggleClinic: (id: string) => void;
  toggleDoctor: (id: string) => void;
  isClinicFavorite: (id: string) => boolean;
  isDoctorFavorite: (id: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  clinicIds: [...MOCK_FAVORITE_CLINIC_IDS],
  doctorIds: [...MOCK_FAVORITE_DOCTOR_IDS],
  toggleClinic: (id) =>
    set((state) => ({
      clinicIds: state.clinicIds.includes(id)
        ? state.clinicIds.filter((x) => x !== id)
        : [...state.clinicIds, id],
    })),
  toggleDoctor: (id) =>
    set((state) => ({
      doctorIds: state.doctorIds.includes(id)
        ? state.doctorIds.filter((x) => x !== id)
        : [...state.doctorIds, id],
    })),
  isClinicFavorite: (id) => get().clinicIds.includes(id),
  isDoctorFavorite: (id) => get().doctorIds.includes(id),
}));

interface UserState {
  id: string;
  fullName: string;
  phone: string;
  avatarUrl: string;
  setProfile: (patch: Partial<Omit<UserState, 'setProfile'>>) => void;
}

export const useUserStore = create<UserState>((set) => ({
  id: CURRENT_USER.id,
  fullName: CURRENT_USER.fullName,
  phone: CURRENT_USER.phone,
  avatarUrl: CURRENT_USER.avatarUrl,
  setProfile: (patch) => set(patch),
}));
