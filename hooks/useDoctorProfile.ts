import { useMemo } from 'react';

import { useAppointments, useClinic, useDoctor, usePatients } from '@/hooks/queries';
import { useDoctorProfileStore } from '@/store/doctorProfileStore';
import { DEMO_DOCTOR_ID } from '@/utils/doctorDashboard';
import {
  buildDoctorProfile,
  buildProfileStats,
  profileCompletion,
} from '@/utils/doctorProfile';

export function useDoctorProfile() {
  const doctor = useDoctor(DEMO_DOCTOR_ID);
  const clinic = useClinic(doctor.data?.clinicId ?? '');
  const patients = usePatients();
  const appointments = useAppointments();
  const overrides = useDoctorProfileStore((s) => s.overrides);
  const notificationSettings = useDoctorProfileStore((s) => s.notificationSettings);
  const patchProfile = useDoctorProfileStore((s) => s.patchProfile);
  const setNotification = useDoctorProfileStore((s) => s.setNotification);
  const biometricEnabled = useDoctorProfileStore((s) => s.biometricEnabled);
  const setBiometricEnabled = useDoctorProfileStore((s) => s.setBiometricEnabled);
  const privacyVisibleToClinic = useDoctorProfileStore((s) => s.privacyVisibleToClinic);
  const privacyVisibleInSearch = useDoctorProfileStore((s) => s.privacyVisibleInSearch);
  const privacyAnalytics = useDoctorProfileStore((s) => s.privacyAnalytics);
  const setPrivacy = useDoctorProfileStore((s) => s.setPrivacy);

  const profile = useMemo(() => {
    if (!doctor.data) return null;
    return buildDoctorProfile({
      doctor: doctor.data,
      clinic: clinic.data,
      overrides,
      notificationSettings,
    });
  }, [doctor.data, clinic.data, overrides, notificationSettings]);

  const stats = useMemo(() => {
    if (!profile) return null;
    return buildProfileStats({
      profile,
      patients: patients.data ?? [],
      appointments: appointments.data ?? [],
    });
  }, [profile, patients.data, appointments.data]);

  const completion = useMemo(() => (profile ? profileCompletion(profile) : null), [profile]);

  return {
    profile,
    stats,
    completion,
    clinic: clinic.data,
    isLoading: doctor.isLoading || clinic.isLoading,
    isError: Boolean(doctor.isError),
    refetch: () => {
      void doctor.refetch();
      void clinic.refetch();
      void patients.refetch();
      void appointments.refetch();
    },
    patchProfile,
    setNotification,
    biometricEnabled,
    setBiometricEnabled,
    privacyVisibleToClinic,
    privacyVisibleInSearch,
    privacyAnalytics,
    setPrivacy,
  };
}
