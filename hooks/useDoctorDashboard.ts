import { useMemo } from 'react';

import { useAppointments, useFinance, usePatients } from '@/hooks/queries';
import { useDoctorMe } from '@/hooks/useDoctorMe';
import { useRealtimeAppointments } from '@/hooks/useRealtimeAppointments';
import type { Doctor, Patient, Room } from '@/types';
import {
  buildDoctorDashboard,
  type DoctorDashboardModel,
} from '@/utils/doctorDashboard';
import { apiGet, useMockApi } from '@/services/apiClient';
import { useQuery } from '@tanstack/react-query';

export function useDoctorDashboard(): {
  model: DoctorDashboardModel;
  doctor: Doctor | null | undefined;
  patients: Patient[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
} {
  const appointments = useAppointments();
  const doctor = useDoctorMe();
  const patients = usePatients();
  const finance = useFinance();
  useRealtimeAppointments();

  const remoteDashboard = useQuery({
    queryKey: ['doctors', 'me', 'dashboard'],
    enabled: !useMockApi() && Boolean(doctor.data?.id),
    queryFn: () => apiGet<Record<string, unknown>>('/doctors/me/dashboard'),
    staleTime: 30_000,
  });

  const roomsQuery = useQuery({
    queryKey: ['rooms'],
    enabled: !useMockApi(),
    queryFn: () => apiGet<Room[]>('/rooms'),
    staleTime: 60_000,
  });

  const model = useMemo(() => {
    const doctorId = doctor.data?.id;
    return buildDoctorDashboard({
      appointments: appointments.data ?? [],
      doctor: doctor.data ?? undefined,
      patients: patients.data ?? [],
      finance: finance.data ?? [],
      rooms: roomsQuery.data ?? [],
      doctorId,
    });
  }, [appointments.data, doctor.data, patients.data, finance.data, roomsQuery.data]);

  // Prefer server aggregates when available
  const merged = useMemo(() => {
    const remote = remoteDashboard.data;
    if (!remote || useMockApi()) return model;
    return {
      ...model,
      todayRevenue:
        typeof remote.todayRevenue === 'number'
          ? remote.todayRevenue
          : model.todayRevenue,
      completedAppointments:
        typeof remote.completedAppointments === 'number'
          ? model.todayAppointments.filter((a) => a.status === 'completed')
          : model.completedAppointments,
      remainingAppointments:
        typeof remote.remainingAppointments === 'number'
          ? model.remainingAppointments
          : model.remainingAppointments,
    };
  }, [model, remoteDashboard.data]);

  return {
    model: merged,
    doctor: doctor.data,
    patients: patients.data ?? [],
    isLoading: appointments.isLoading || doctor.isLoading,
    isError: Boolean(appointments.isError || doctor.isError),
    refetch: () => {
      void appointments.refetch();
      void doctor.refetch();
      void patients.refetch();
      void finance.refetch();
      void remoteDashboard.refetch();
    },
  };
}
