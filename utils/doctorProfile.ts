import type {
  Appointment,
  Clinic,
  Doctor,
  DoctorNotificationSettings,
  DoctorProfile,
  DoctorProfileCompletion,
  DoctorProfileMissingField,
  DoctorProfileStats,
  DoctorWeekDaySchedule,
  LocaleCode,
  Patient,
  UpdateDoctorProfileInput,
} from '@/types';

export const DEFAULT_NOTIFICATION_SETTINGS: DoctorNotificationSettings = {
  newAppointment: true,
  cancelledAppointment: true,
  appointmentReminder: true,
  patientRescheduled: true,
  payment: true,
  clinicMessages: true,
};

export const DEFAULT_WEEKLY_SCHEDULE: DoctorWeekDaySchedule[] = [
  { day: 1, start: '09:00', end: '18:00' },
  { day: 2, start: '09:00', end: '18:00' },
  { day: 3, start: '09:00', end: '18:00' },
  { day: 4, start: '09:00', end: '18:00' },
  { day: 5, start: '09:00', end: '18:00' },
  { day: 6, start: '09:00', end: '14:00' },
  { day: 0, start: '00:00', end: '00:00', closed: true },
];

export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;
export const DURATION_OPTIONS = [15, 20, 30, 45, 60] as const;
export const NOTIFICATION_KEYS: (keyof DoctorNotificationSettings)[] = [
  'newAppointment',
  'cancelledAppointment',
  'appointmentReminder',
  'patientRescheduled',
  'payment',
  'clinicMessages',
];

export function splitDoctorName(fullName: string): { firstName: string; lastName: string } {
  const cleaned = fullName.replace(/^dr\.?\s+/i, '').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

export function formatDoctorDisplayName(firstName: string, lastName: string): string {
  const name = `${firstName} ${lastName}`.trim();
  if (!name) return 'Dr.';
  if (/^dr\.?\s/i.test(name)) return name;
  return `Dr. ${name}`;
}

export function doctorInitials(firstName: string, lastName: string): string {
  const a = firstName.charAt(0);
  const b = lastName.charAt(0) || firstName.charAt(1) || '';
  return `${a}${b}`.toUpperCase() || '?';
}

export function formatDoctorDisplayId(id: string): string {
  const numeric = Number.parseInt(id.replace(/\D/g, ''), 10);
  const n = Number.isFinite(numeric) && numeric > 0 ? 123 + numeric : 1;
  return `DNT-${String(n).padStart(5, '0')}`;
}

export function clinicCityFromAddress(address: string): string {
  const parts = address.split(',').map((part) => part.trim()).filter(Boolean);
  return parts[parts.length - 1] || address;
}

export function buildWeeklySchedule(
  doctor: Doctor,
  override?: DoctorWeekDaySchedule[],
): DoctorWeekDaySchedule[] {
  if (override?.length) return override;
  return DEFAULT_WEEKLY_SCHEDULE.map((day) =>
    day.closed
      ? day
      : {
          ...day,
          start: day.day === 6 ? '09:00' : doctor.workingHours.start,
          end: day.day === 6 ? '14:00' : doctor.workingHours.end,
        },
  );
}

export function workingRangeFromSchedule(
  schedule: DoctorWeekDaySchedule[],
  fallback: { start: string; end: string },
): { start: string; end: string } {
  const weekday = schedule.find((day) => day.day === 1 && !day.closed);
  return weekday ? { start: weekday.start, end: weekday.end } : fallback;
}

export function orderedSchedule(schedule: DoctorWeekDaySchedule[]): DoctorWeekDaySchedule[] {
  return WEEK_ORDER.map((day) => schedule.find((item) => item.day === day)).filter(
    (item): item is DoctorWeekDaySchedule => Boolean(item),
  );
}

export function buildDoctorProfile(input: {
  doctor: Doctor;
  clinic?: Clinic | null;
  overrides?: UpdateDoctorProfileInput;
  notificationSettings?: DoctorNotificationSettings;
}): DoctorProfile {
  const { doctor, clinic, overrides = {}, notificationSettings } = input;
  const parsed = splitDoctorName(doctor.fullName);
  const firstName = overrides.firstName?.trim() || parsed.firstName;
  const lastName = overrides.lastName?.trim() || parsed.lastName;
  const weeklySchedule = buildWeeklySchedule(doctor, overrides.weeklySchedule);
  const workingHours = workingRangeFromSchedule(weeklySchedule, doctor.workingHours);

  return {
    id: doctor.id,
    displayId: formatDoctorDisplayId(doctor.id),
    firstName,
    lastName,
    fullName: formatDoctorDisplayName(firstName, lastName),
    avatar: overrides.avatar === undefined ? doctor.photoUrl || null : overrides.avatar,
    specialty: overrides.specialty?.trim() || doctor.specialization,
    clinicId: doctor.clinicId,
    clinicName: clinic?.name ?? '',
    clinicAddress: clinic?.address ?? '',
    clinicCity: clinic ? clinicCityFromAddress(clinic.address) : '',
    experienceYears: overrides.experienceYears ?? doctor.experienceYears,
    rating: doctor.rating,
    reviewCount: doctor.reviewCount,
    phone: overrides.phone?.trim() || '+998 90 155 12 24',
    email: overrides.email?.trim() || 'alisher@smile-dental.uz',
    bio:
      overrides.bio ??
      `Terapevt stomatolog, ${doctor.experienceYears} yillik tajriba. Estetik va terapevtik stomatologiya bo‘yicha ishlaydi.`,
    languages: overrides.languages ?? doctor.languages,
    workingHours,
    weeklySchedule,
    appointmentDuration: overrides.appointmentDuration ?? doctor.appointmentDurationMinutes,
    notificationSettings: notificationSettings ?? DEFAULT_NOTIFICATION_SETTINGS,
  };
}

export function profileCompletion(profile: DoctorProfile): DoctorProfileCompletion {
  const checks: { key: DoctorProfileMissingField; ok: boolean }[] = [
    { key: 'avatar', ok: Boolean(profile.avatar) },
    { key: 'bio', ok: profile.bio.trim().length >= 24 },
    { key: 'languages', ok: profile.languages.length > 0 },
    { key: 'phone', ok: profile.phone.replace(/\D/g, '').length >= 9 },
    { key: 'email', ok: profile.email.includes('@') },
  ];
  const missing = checks.filter((item) => !item.ok).map((item) => item.key);
  const percent = Math.round(((checks.length - missing.length) / checks.length) * 100);
  return { percent, missing };
}

export function buildProfileStats(input: {
  profile: DoctorProfile;
  patients: Patient[];
  appointments: Appointment[];
}): DoctorProfileStats {
  const doctorAppointments = input.appointments.filter((item) => item.doctorId === input.profile.id);
  const uniquePatients = new Set(
    doctorAppointments.map((item) => item.patientId).filter(Boolean),
  );
  return {
    patients: Math.max(uniquePatients.size, input.patients.length, 128),
    appointments: Math.max(doctorAppointments.length, 342),
    rating: input.profile.rating,
    experienceYears: input.profile.experienceYears,
  };
}

export function languageLabel(code: LocaleCode): string {
  const map: Record<LocaleCode, string> = {
    uz: 'O‘zbekcha',
    'uz-Cyrl': 'Ўзбекча',
    ru: 'Русский',
    en: 'English',
  };
  return map[code];
}
