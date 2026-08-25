import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import type {
  Appointment,
  AppointmentStatus,
  Clinic,
  Doctor,
  FinanceRecord,
  InventoryItem,
  Patient,
} from '@/types';
import {
  getAppointmentById,
  getAppointments,
} from '@/services/appointmentService';
import {
  getClinicById,
  getClinics,
  getNearbyClinics,
  getPopularClinics,
  type GetClinicsParams,
} from '@/services/clinicService';
import {
  getAvailableToday,
  getDoctorById,
  getDoctors,
  getTopDoctors,
  type GetDoctorsParams,
} from '@/services/doctorService';
import {
  getClinicDashboardStats,
  getDoctorTodayStats,
  getFinanceRecords,
  type FinanceFilter,
} from '@/services/financeService';
import { getInventory, getLowStock } from '@/services/inventoryService';
import { getClinicMarkers, type MapMarker } from '@/services/mapService';
import { getPatientById, getPatients } from '@/services/patientService';

export const queryKeys = {
  clinics: {
    all: ['clinics'] as const,
    list: (params?: GetClinicsParams) => ['clinics', 'list', params] as const,
    detail: (id: string) => ['clinics', 'detail', id] as const,
    nearby: (limit?: number) => ['clinics', 'nearby', limit] as const,
    popular: (limit?: number) => ['clinics', 'popular', limit] as const,
  },
  doctors: {
    all: ['doctors'] as const,
    list: (params?: GetDoctorsParams) => ['doctors', 'list', params] as const,
    detail: (id: string) => ['doctors', 'detail', id] as const,
    top: (limit?: number) => ['doctors', 'top', limit] as const,
    availableToday: (limit?: number) =>
      ['doctors', 'availableToday', limit] as const,
  },
  appointments: {
    all: ['appointments'] as const,
    list: (status?: AppointmentStatus) =>
      ['appointments', 'list', status] as const,
    detail: (id: string) => ['appointments', 'detail', id] as const,
  },
  patients: {
    all: ['patients'] as const,
    list: (query?: string) => ['patients', 'list', query] as const,
    detail: (id: string) => ['patients', 'detail', id] as const,
  },
  finance: {
    all: ['finance'] as const,
    list: (filter?: FinanceFilter) => ['finance', 'list', filter] as const,
    doctorStats: ['finance', 'doctorStats'] as const,
    clinicStats: ['finance', 'clinicStats'] as const,
  },
  inventory: {
    all: ['inventory'] as const,
    list: ['inventory', 'list'] as const,
    lowStock: ['inventory', 'lowStock'] as const,
  },
  map: {
    clinicMarkers: ['map', 'clinicMarkers'] as const,
  },
} as const;

type DoctorStats = Awaited<ReturnType<typeof getDoctorTodayStats>>;
type ClinicStats = Awaited<ReturnType<typeof getClinicDashboardStats>>;

export function useClinics(
  params?: GetClinicsParams,
  options?: Omit<UseQueryOptions<Clinic[]>, 'queryKey' | 'queryFn'>,
): UseQueryResult<Clinic[]> {
  return useQuery({
    queryKey: queryKeys.clinics.list(params),
    queryFn: () => getClinics(params),
    ...options,
  });
}

export function useClinic(
  id: string,
  options?: Omit<UseQueryOptions<Clinic | null>, 'queryKey' | 'queryFn'>,
): UseQueryResult<Clinic | null> {
  return useQuery({
    queryKey: queryKeys.clinics.detail(id),
    queryFn: () => getClinicById(id),
    enabled: Boolean(id),
    ...options,
  });
}

export function useNearbyClinics(
  limit?: number,
  options?: Omit<UseQueryOptions<Clinic[]>, 'queryKey' | 'queryFn'>,
): UseQueryResult<Clinic[]> {
  return useQuery({
    queryKey: queryKeys.clinics.nearby(limit),
    queryFn: () => getNearbyClinics(limit),
    ...options,
  });
}

export function usePopularClinics(
  limit?: number,
  options?: Omit<UseQueryOptions<Clinic[]>, 'queryKey' | 'queryFn'>,
): UseQueryResult<Clinic[]> {
  return useQuery({
    queryKey: queryKeys.clinics.popular(limit),
    queryFn: () => getPopularClinics(limit),
    ...options,
  });
}

export function useDoctors(
  params?: GetDoctorsParams,
  options?: Omit<UseQueryOptions<Doctor[]>, 'queryKey' | 'queryFn'>,
): UseQueryResult<Doctor[]> {
  return useQuery({
    queryKey: queryKeys.doctors.list(params),
    queryFn: () => getDoctors(params),
    ...options,
  });
}

export function useDoctor(
  id: string,
  options?: Omit<UseQueryOptions<Doctor | null>, 'queryKey' | 'queryFn'>,
): UseQueryResult<Doctor | null> {
  return useQuery({
    queryKey: queryKeys.doctors.detail(id),
    queryFn: () => getDoctorById(id),
    enabled: Boolean(id),
    ...options,
  });
}

export function useTopDoctors(
  limit?: number,
  options?: Omit<UseQueryOptions<Doctor[]>, 'queryKey' | 'queryFn'>,
): UseQueryResult<Doctor[]> {
  return useQuery({
    queryKey: queryKeys.doctors.top(limit),
    queryFn: () => getTopDoctors(limit),
    ...options,
  });
}

export function useAvailableTodayDoctors(
  limit?: number,
  options?: Omit<UseQueryOptions<Doctor[]>, 'queryKey' | 'queryFn'>,
): UseQueryResult<Doctor[]> {
  return useQuery({
    queryKey: queryKeys.doctors.availableToday(limit),
    queryFn: () => getAvailableToday(limit),
    ...options,
  });
}

export function useAppointments(
  status?: AppointmentStatus,
  options?: Omit<UseQueryOptions<Appointment[]>, 'queryKey' | 'queryFn'>,
): UseQueryResult<Appointment[]> {
  return useQuery({
    queryKey: queryKeys.appointments.list(status),
    queryFn: () => getAppointments(status),
    ...options,
  });
}

export function useAppointment(
  id: string,
  options?: Omit<UseQueryOptions<Appointment | null>, 'queryKey' | 'queryFn'>,
): UseQueryResult<Appointment | null> {
  return useQuery({
    queryKey: queryKeys.appointments.detail(id),
    queryFn: () => getAppointmentById(id),
    enabled: Boolean(id),
    ...options,
  });
}

export function usePatients(
  query?: string,
  options?: Omit<UseQueryOptions<Patient[]>, 'queryKey' | 'queryFn'>,
): UseQueryResult<Patient[]> {
  return useQuery({
    queryKey: queryKeys.patients.list(query),
    queryFn: () => getPatients(query),
    ...options,
  });
}

export function usePatient(
  id: string,
  options?: Omit<UseQueryOptions<Patient | null>, 'queryKey' | 'queryFn'>,
): UseQueryResult<Patient | null> {
  return useQuery({
    queryKey: queryKeys.patients.detail(id),
    queryFn: () => getPatientById(id),
    enabled: Boolean(id),
    ...options,
  });
}

export function useFinance(
  filter?: FinanceFilter,
  options?: Omit<UseQueryOptions<FinanceRecord[]>, 'queryKey' | 'queryFn'>,
): UseQueryResult<FinanceRecord[]> {
  return useQuery({
    queryKey: queryKeys.finance.list(filter),
    queryFn: () => getFinanceRecords(filter),
    ...options,
  });
}

export function useDoctorStats(
  options?: Omit<UseQueryOptions<DoctorStats>, 'queryKey' | 'queryFn'>,
): UseQueryResult<DoctorStats> {
  return useQuery({
    queryKey: queryKeys.finance.doctorStats,
    queryFn: () => getDoctorTodayStats(),
    ...options,
  });
}

export function useClinicStats(
  options?: Omit<UseQueryOptions<ClinicStats>, 'queryKey' | 'queryFn'>,
): UseQueryResult<ClinicStats> {
  return useQuery({
    queryKey: queryKeys.finance.clinicStats,
    queryFn: () => getClinicDashboardStats(),
    ...options,
  });
}

export function useInventory(
  options?: Omit<UseQueryOptions<InventoryItem[]>, 'queryKey' | 'queryFn'>,
): UseQueryResult<InventoryItem[]> {
  return useQuery({
    queryKey: queryKeys.inventory.list,
    queryFn: () => getInventory(),
    ...options,
  });
}

export function useLowStock(
  options?: Omit<UseQueryOptions<InventoryItem[]>, 'queryKey' | 'queryFn'>,
): UseQueryResult<InventoryItem[]> {
  return useQuery({
    queryKey: queryKeys.inventory.lowStock,
    queryFn: () => getLowStock(),
    ...options,
  });
}

export function useClinicMarkers(
  options?: Omit<UseQueryOptions<MapMarker[]>, 'queryKey' | 'queryFn'>,
): UseQueryResult<MapMarker[]> {
  return useQuery({
    queryKey: queryKeys.map.clinicMarkers,
    queryFn: () => getClinicMarkers(),
    ...options,
  });
}
