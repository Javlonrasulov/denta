import { useMemo } from 'react';

import { useAppointments, useDoctor, useFinance, usePatients } from '@/hooks/queries';
import { MOCK_ROOMS } from '@/mocks/data';
import type { Doctor, Patient } from '@/types';
import {
  buildDoctorDashboard,
  DEMO_DOCTOR_ID,
  type DoctorDashboardModel,
} from '@/utils/doctorDashboard';

export function useDoctorDashboard(): {
  model: DoctorDashboardModel;
  doctor: Doctor | null | undefined;
  patients: Patient[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
} {
  const appointments = useAppointments();
  const doctor = useDoctor(DEMO_DOCTOR_ID);
  const patients = usePatients();
  const finance = useFinance();

  const model = useMemo(
    () =>
      buildDoctorDashboard({
        appointments: appointments.data ?? [],
        doctor: doctor.data,
        patients: patients.data ?? [],
        finance: finance.data ?? [],
        rooms: MOCK_ROOMS,
        doctorId: DEMO_DOCTOR_ID,
      }),
    [appointments.data, doctor.data, patients.data, finance.data],
  );

  return {
    model,
    doctor: doctor.data,
    patients: patients.data ?? [],
    isLoading: appointments.isLoading || doctor.isLoading,
    isError: Boolean(appointments.isError || doctor.isError),
    refetch: () => {
      void appointments.refetch();
      void doctor.refetch();
      void patients.refetch();
      void finance.refetch();
    },
  };
}
