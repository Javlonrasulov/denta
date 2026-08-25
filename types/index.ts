export type UserRole = 'client' | 'doctor' | 'clinic';
export type LocaleCode = 'uz' | 'uz-Cyrl' | 'ru' | 'en';
export type AppointmentStatus = 'upcoming' | 'completed' | 'cancelled';
export type RoomStatus = 'available' | 'occupied' | 'maintenance';
export type PaymentStatus = 'paid' | 'pending' | 'overdue';
export type Gender = 'male' | 'female';
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

export interface Patient {
  id: string;
  fullName: string;
  phone: string;
  gender: Gender;
  birthDate: string;
  lastVisit?: string;
  nextAppointment?: string;
  status: 'active' | 'inactive';
  notes?: string;
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
  patientName?: string;
  doctorName?: string;
  serviceName: string;
  amount: number;
  type: 'income' | 'expense';
  paymentStatus: PaymentStatus;
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
