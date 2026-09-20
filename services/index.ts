export {
  apiDelay,
  mockNetworkDelay,
  ApiError,
  useMockApi,
  apiBaseUrl,
  assertApiConfigured,
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
  rescheduleAppointment,
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
  revokeSession,
  revokeOtherSessions,
} from './doctorProfileService';
export type { AvatarPickSource, AvatarPickResult } from './doctorProfileService';

export { getApiErrorMessage, resolveErrorLocale } from './errorMessages';

export {
  requestPermissions,
  getNotificationTypes,
  scheduleLocal,
} from './notificationService';
export type {
  NotificationType,
  ScheduleLocalInput,
} from './notificationService';
