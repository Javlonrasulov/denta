import { useMemo } from 'react';

import { useAppointments, useClinic, usePatients } from '@/hooks/queries';
import { useDoctorMe } from '@/hooks/useDoctorMe';
import { updateMyDoctorProfile, replaceMyDoctorSchedule } from '@/services/doctorService';
import { useMockApi } from '@/services/apiClient';
import { useDoctorProfileStore } from '@/store/doctorProfileStore';
import {
  buildDoctorProfile,
  buildProfileStats,
  profileCompletion,
} from '@/utils/doctorProfile';
import type { UpdateDoctorProfileInput } from '@/types';

export function useDoctorProfile() {
  const doctor = useDoctorMe();
  const clinic = useClinic(doctor.data?.clinicId ?? '');
  const patients = usePatients();
  const appointments = useAppointments();
  const overrides = useDoctorProfileStore((s) => s.overrides);
  const notificationSettings = useDoctorProfileStore((s) => s.notificationSettings);
  const storePatch = useDoctorProfileStore((s) => s.patchProfile);
  const setNotification = useDoctorProfileStore((s) => s.setNotification);
  const biometricEnabled = useDoctorProfileStore((s) => s.biometricEnabled);
  const setBiometricEnabled = useDoctorProfileStore((s) => s.setBiometricEnabled);
  const privacyVisibleToClinic = useDoctorProfileStore((s) => s.privacyVisibleToClinic);
  const privacyVisibleInSearch = useDoctorProfileStore((s) => s.privacyVisibleInSearch);
  const privacyAnalytics = useDoctorProfileStore((s) => s.privacyAnalytics);
  const setPrivacy = useDoctorProfileStore((s) => s.setPrivacy);

  const patchProfile = (patch: UpdateDoctorProfileInput) => {
    storePatch(patch);
    if (useMockApi()) return;
    void (async () => {
      const body: Record<string, unknown> = {};
      if (patch.firstName) body.firstName = patch.firstName;
      if (patch.lastName) body.lastName = patch.lastName;
      if (patch.bio) body.bio = patch.bio;
      if (patch.phone) body.phone = patch.phone;
      if (patch.specialty) body.specialty = patch.specialty;
      if (Object.keys(body).length) {
        await updateMyDoctorProfile(body);
        void doctor.refetch();
      }
      if (patch.weeklySchedule?.length) {
        await replaceMyDoctorSchedule(
          patch.weeklySchedule
            .filter((d) => !d.closed)
            .map((d) => ({
              dayOfWeek: d.day,
              startTime: d.start,
              endTime: d.end,
              slotDuration: patch.appointmentDuration,
            })),
        );
        void doctor.refetch();
      }
    })();
  };

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

  const completion = useMemo(
    () => (profile ? profileCompletion(profile) : null),
    [profile],
  );

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
