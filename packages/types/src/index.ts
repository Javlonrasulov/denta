export type UserRole = 'client' | 'doctor' | 'clinic';
export type LocaleCode = 'uz' | 'uz-Cyrl' | 'ru' | 'en';
export type AppointmentStatus = 'upcoming' | 'completed' | 'cancelled';
export type RoomStatus = 'available' | 'occupied' | 'maintenance';
export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'partial' | 'cancelled';
export type PaymentMethod = 'card' | 'cash' | 'transfer';
export type Gender = 'male' | 'female';

export interface CreatePatientInput {
  firstName: string;
  lastName: string;
  phone: string;
  birthDate: string;
  gender: Gender;
  notes?: string;
}

export type ToothCondition =
  | 'healthy'
  | 'caries'
  | 'filled'
  | 'crown'
  | 'missing'
  | 'root_canal'
  | 'implant'
  | 'needs_treatment';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Clinic {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  coverUrl: string;
  rating: number;
  reviewCount: number;
  address: string;
  phone: string;
  coordinates: Coordinates;
  workingHours: { day: number; open: string; close: string; closed?: boolean }[]; // 0=Sun
  isOpenNow: boolean;
  specializations: string[];
  photos: string[];
  about: string;
  priceFrom: number;
  distanceKm?: number;
}

export interface Doctor {
  id: string;
  clinicId: string;
  fullName: string;
  photoUrl: string;
  specialization: string;
  experienceYears: number;
  rating: number;
  reviewCount: number;
  gender: Gender;
  languages: LocaleCode[];
  bio: string;
  priceFrom: number;
  workingHours: { start: string; end: string }; // "09:00" "18:00"
  breakTime: { start: string; end: string }; // "13:00" "14:00"
  appointmentDurationMinutes: number; // 30
  services: Service[];
}

export interface Service {
  id: string;
  name: string;
  nameKey?: string;
  durationMinutes: number;
  price: number;
  category: string;
}

export type PatientClinicalStatus =
  | 'new'
  | 'treatment'
  | 'follow_up'
  | 'completed'
  | 'debt';

export type TreatmentStatus = 'planned' | 'in_progress' | 'completed';

export interface PatientTreatment {
  id: string;
  date: string;
  title?: string;
  titleKey?: string;
  doctorName?: string;
  tooth?: string;
  status: TreatmentStatus;
}

export interface PatientPayment {
  id: string;
  date: string;
  amount: number;
  method?: string;
  note?: string;
}

export interface Patient {
  id: string;
  displayId?: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  gender: Gender;
  birthDate: string;
  lastVisit?: string;
  nextAppointment?: string;
  nextAppointmentTime?: string;
  status: 'active' | 'inactive';
  clinicalStatus?: PatientClinicalStatus;
  notes?: string;
  avatar?: string;
  balance?: number;
  visitCount?: number;
  treatments?: PatientTreatment[];
  payments?: PatientPayment[];
  problemTeeth?: number[];
  currentServiceKey?: string;
  createdAt?: string;
}

export interface Appointment {
  id: string;
  doctorId: string;
  clinicId: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  clinicName: string;
  clinicAddress: string;
  serviceName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: AppointmentStatus;
  price: number;
  notes?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface Review {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
  date: string;
  doctorId?: string;
  clinicId?: string;
}

export interface Room {
  id: string;
  name: string;
  number: string;
  doctorId?: string;
  doctorName?: string;
  status: RoomStatus;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  purchasePrice: number;
  minStock: number;
  supplier: string;
}

export interface FinanceRecord {
  id: string;
  date: string;
  time?: string;
  patientName?: string;
  patientId?: string;
  doctorName?: string;
  doctorId?: string;
  serviceName: string;
  amount: number;
  type: 'income' | 'expense';
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  notes?: string;
}

export interface ToothRecord {
  toothNumber: number; // FDI 11-48
  condition: ToothCondition;
  treatment?: string;
  notes?: string;
}

export interface Specialization {
  id: string;
  nameKey: string;
  icon: string;
}

export type DoctorNotificationKey =
  | 'newAppointment'
  | 'cancelledAppointment'
  | 'appointmentReminder'
  | 'patientRescheduled'
  | 'payment'
  | 'clinicMessages';

export interface DoctorNotificationSettings {
  newAppointment: boolean;
  cancelledAppointment: boolean;
  appointmentReminder: boolean;
  patientRescheduled: boolean;
  payment: boolean;
  clinicMessages: boolean;
}

export interface DoctorWeekDaySchedule {
  day: number;
  start: string;
  end: string;
  closed?: boolean;
}

export interface DoctorProfile {
  id: string;
  displayId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatar: string | null;
  specialty: string;
  clinicId: string;
  clinicName: string;
  clinicAddress: string;
  clinicCity: string;
  experienceYears: number;
  rating: number;
  reviewCount: number;
  phone: string;
  email: string;
  bio: string;
  languages: LocaleCode[];
  workingHours: { start: string; end: string };
  weeklySchedule: DoctorWeekDaySchedule[];
  appointmentDuration: number;
  notificationSettings: DoctorNotificationSettings;
}

export interface DoctorProfileStats {
  patients: number;
  appointments: number;
  rating: number;
  experienceYears: number;
}

export type DoctorProfileMissingField = 'avatar' | 'bio' | 'languages' | 'phone' | 'email';

export interface DoctorProfileCompletion {
  percent: number;
  missing: DoctorProfileMissingField[];
}

export interface DoctorDeviceSession {
  id: string;
  device: string;
  location: string;
  lastActiveKey: 'now' | 'hours' | 'days';
  lastActiveCount?: number;
  current: boolean;
}

export interface UpdateDoctorProfileInput {
  firstName?: string;
  lastName?: string;
  specialty?: string;
  experienceYears?: number;
  phone?: string;
  email?: string;
  bio?: string;
  languages?: LocaleCode[];
  appointmentDuration?: number;
  weeklySchedule?: DoctorWeekDaySchedule[];
  notificationSettings?: Partial<DoctorNotificationSettings>;
  avatar?: string | null;
}

export interface DoctorAvatarUploadResult {
  uri: string;
  pendingUpload: boolean;
}
