import { create } from 'zustand';

import {
  apiDelete,
  apiGet,
  apiPost,
  useMockApi,
} from '@/services/apiClient';

interface FavoritesState {
  clinicIds: string[];
  doctorIds: string[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  toggleClinic: (id: string) => Promise<void>;
  toggleDoctor: (id: string) => Promise<void>;
  isClinicFavorite: (id: string) => boolean;
  isDoctorFavorite: (id: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  clinicIds: [],
  doctorIds: [],
  hydrated: false,
  hydrate: async () => {
    if (useMockApi()) {
      set({ clinicIds: [], doctorIds: [], hydrated: true });
      return;
    }
    try {
      const data = await apiGet<{ clinicIds: string[]; doctorIds: string[] }>(
        '/favorites',
      );
      set({
        clinicIds: data.clinicIds,
        doctorIds: data.doctorIds,
        hydrated: true,
      });
    } catch {
      set({ hydrated: true });
    }
  },
  toggleClinic: async (id) => {
    const isFav = get().clinicIds.includes(id);
    set((state) => ({
      clinicIds: isFav
        ? state.clinicIds.filter((x) => x !== id)
        : [...state.clinicIds, id],
    }));
    if (useMockApi()) return;
    try {
      if (isFav) await apiDelete(`/favorites/clinics/${id}`);
      else await apiPost(`/favorites/clinics/${id}`);
    } catch {
      // revert
      set((state) => ({
        clinicIds: isFav
          ? [...state.clinicIds, id]
          : state.clinicIds.filter((x) => x !== id),
      }));
    }
  },
  toggleDoctor: async (id) => {
    const isFav = get().doctorIds.includes(id);
    set((state) => ({
      doctorIds: isFav
        ? state.doctorIds.filter((x) => x !== id)
        : [...state.doctorIds, id],
    }));
    if (useMockApi()) return;
    try {
      if (isFav) await apiDelete(`/favorites/doctors/${id}`);
      else await apiPost(`/favorites/doctors/${id}`);
    } catch {
      set((state) => ({
        doctorIds: isFav
          ? [...state.doctorIds, id]
          : state.doctorIds.filter((x) => x !== id),
      }));
    }
  },
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
  id: '',
  fullName: '',
  phone: '',
  avatarUrl: '',
  setProfile: (patch) => set(patch),
}));
