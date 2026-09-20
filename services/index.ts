export {
  apiDelay,
  mockNetworkDelay,
  ApiError,
} from './apiClient';

export {
  getClinics,
  getClinicById,
  getNearbyClinics,
  getPopularClinics,
} from './clinicService';
export type { GetClinicsParams } from './clinicService';

export {
  getDoctors,
  getDoctorById,
  getTopDoctors,
  getAvailableToday,
  getDoctorSlots,
} from './doctorService';
export type { GetDoctorsParams } from './doctorService';

export {
  getAppointments,
  getAppointmentById,
  createAppointment,
  cancelAppointment,
} from './appointmentService';

export { getPatients, getPatientById, createPatient, addPatientNote } from './patientService';

export {
  getFinanceRecords,
  createFinanceRecord,
  updateFinanceRecord,
  getDoctorTodayStats,
  getClinicDashboardStats,
} from './financeService';
export type { FinanceFilter, CreateFinanceInput } from './financeService';

export { getInventory, getLowStock } from './inventoryService';

export { getClinicMarkers } from './mapService';
export type { MapMarker, MapProvider } from './mapService';

export {
  pickDoctorAvatar,
  uploadDoctorAvatar,
  getDoctorSessions,
} from './doctorProfileService';
export type { AvatarPickSource, AvatarPickResult } from './doctorProfileService';

export {
  requestPermissions,
  getNotificationTypes,
  scheduleLocal,
} from './notificationService';
export type {
  NotificationType,
  ScheduleLocalInput,
} from './notificationService';
