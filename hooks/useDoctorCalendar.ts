import { useEffect, useMemo, useState } from 'react';

import { useAppointments, useFinance, usePatients } from '@/hooks/queries';
import { useDoctorMe } from '@/hooks/useDoctorMe';
import type { Appointment, Doctor, FinanceRecord, Patient } from '@/types';
import {
  buildDoctorCalendar,
  type CalendarFilter,
  type DoctorCalendarModel,
} from '@/utils/doctorCalendar';
import { localDateKey } from '@/utils/doctorDashboard';

export function useDoctorCalendar(selectedKey: string, filter: CalendarFilter): {
  model: DoctorCalendarModel;
  doctor: Doctor | null | undefined;
  patients: Patient[];
  finance: FinanceRecord[];
  appointments: Appointment[];
  now: Date;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
} {
  const [now, setNow] = useState(() => new Date());
  const appointments = useAppointments();
  const doctor = useDoctorMe();
  const patients = usePatients();
  const finance = useFinance();

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const model = useMemo(
    () =>
      buildDoctorCalendar({
        appointments: appointments.data ?? [],
        doctor: doctor.data ?? undefined,
        selectedKey: selectedKey || localDateKey(now),
        filter,
        now,
        doctorId: doctor.data?.id,
      }),
    [appointments.data, doctor.data, selectedKey, filter, now],
  );

  return {
    model,
    doctor: doctor.data,
    patients: patients.data ?? [],
    finance: finance.data ?? [],
    appointments: appointments.data ?? [],
    now,
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
