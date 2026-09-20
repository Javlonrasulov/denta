import { useEffect, useMemo, useState } from 'react';

import { useAppointments, useDoctor, useFinance, usePatients } from '@/hooks/queries';
import type { Appointment, Doctor, FinanceRecord, Patient } from '@/types';
import {
  buildDoctorCalendar,
  type CalendarFilter,
  type DoctorCalendarModel,
} from '@/utils/doctorCalendar';
import { DEMO_DOCTOR_ID, localDateKey } from '@/utils/doctorDashboard';

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
  const doctor = useDoctor(DEMO_DOCTOR_ID);
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
        doctor: doctor.data,
        selectedKey: selectedKey || localDateKey(now),
        filter,
        now,
        doctorId: DEMO_DOCTOR_ID,
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
