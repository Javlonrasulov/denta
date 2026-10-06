/**
 * Clinic CRM domain API client (non-auth).
 * Uses NEXT_PUBLIC_API_URL — leave unset only for page-level mocks.
 */

import { refreshAccessToken } from '@/lib/auth/token-refresh';

export type ClinicDashboardStats = {
  totalPatients: number;
  appointmentsToday: number;
  completedToday: number;
  newPatientsThisMonth: number;
  revenueToday: number;
  revenueThisMonth: number;
  cancellationRate: number;
};

export type ClinicAppointment = {
  id: string;
  doctorId: string;
  clinicId: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  clinicName: string;
  clinicAddress: string;
  serviceName: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  price: number;
  notes?: string;
};

export type ClinicPatient = {
  id: string;
  displayId?: string;
  fullName: string;
  phone: string;
  status: 'active' | 'inactive';
  clinicalStatus?: string;
  balance?: number;
  visitCount?: number;
};

export type ClinicDoctor = {
  id: string;
  clinicId: string;
  fullName: string;
  photoUrl: string;
  specialization: string;
  experienceYears: number;
  rating: number;
  priceFrom: number;
};

export type ClinicDoctorRow = ClinicDoctor & {
  membershipId: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  isActive: boolean;
  mustChangePassword: boolean;
  /** ISO time of the last request from the mobile app in this clinic. */
  lastAppSeenAt: string | null;
  lastAppPlatform: 'android' | 'ios' | string | null;
  schedule: DoctorScheduleDay[];
  slotDuration: number;
};

/** A working day; days missing from a schedule are days off. dayOfWeek: 0=Sun … 6=Sat. */
export type DoctorScheduleDay = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breakStart: string | null;
  breakEnd: string | null;
};

export type CreateClinicDoctorBody = {
  firstName: string;
  lastName: string;
  /** Either `phone` or `existingUserId` (picked from a name lookup). */
  phone?: string;
  existingUserId?: string;
  specialties: string[];
  experienceYears?: number;
  schedule: DoctorScheduleDay[];
  slotDuration: number;
  /** Optional financial agreement saved right after the doctor is created. */
  agreement?: SaveAgreementBody;
};

export type UpdateClinicDoctorBody = Partial<{
  firstName: string;
  lastName: string;
  specialties: string[];
  experienceYears: number;
  /** 0 clears the price. */
  priceFrom: number;
  schedule: DoctorScheduleDay[];
  slotDuration: number;
}>;

export type DoctorLookupMatch = {
  userId: string;
  firstName: string;
  lastName: string;
  phoneMasked: string;
  isDoctor: boolean;
  photoUrl: string | null;
  specialty: string | null;
  experienceYears: number;
  alreadyHere: boolean;
  clinics: {
    clinicId: string;
    clinicName: string;
    isThisClinic: boolean;
    current: boolean;
    startedAt: string;
    endedAt: string | null;
    schedule: DoctorScheduleDay[];
  }[];
};

export type ClinicDoctorSpecialty = { id: string; name: string; doctorCount: number };

export type CreateClinicDoctorResult = (
  | {
      kind: 'created';
      login: string;
      temporaryPassword: string;
      mustChangePassword: true;
      member: ClinicMember;
    }
  | { kind: 'attached'; login: string; displayName: string; member: ClinicMember }
) & {
  /** DoctorProfile id (used by /doctors/[id]). */
  doctorId?: string | null;
  /** Present only when an agreement was sent with the request. */
  agreementSaved?: boolean;
  agreementError?: { code: string; message: string };
};

// ─── Doctor financial agreements / rent ───────────────────────────────────────

export type DoctorFinanceModel =
  | 'CLINIC_REVENUE'
  | 'DOCTOR_REVENUE_PLUS_RENT'
  | 'REVENUE_SHARE'
  | 'CUSTOM';
export type RentRecurrence =
  | 'DAILY'
  | 'WEEKLY'
  | 'MONTHLY'
  | 'INTERVAL'
  | 'CUSTOM_SCHEDULE'
  | 'ONE_TIME';
export type RentIntervalUnit = 'DAY' | 'WEEK' | 'MONTH';
export type RentDailyBasis = 'CALENDAR_DAYS' | 'WORKING_DAYS';
export type RentPaymentMethod = 'cash' | 'card' | 'transfer' | 'other';
export type RentObligationStatus =
  | 'UPCOMING'
  | 'DUE'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED';
export type DoctorRentRowStatus = 'paid' | 'pending' | 'debtor' | 'overdue' | 'not_configured';

export type RentTermsBody = {
  amountUzs?: number;
  recurrence: RentRecurrence;
  intervalValue?: number;
  intervalUnit?: RentIntervalUnit;
  /** 0 = Sunday … 6 = Saturday */
  dueDayOfWeek?: number;
  dueDayOfMonth?: number;
  dailyBasis?: RentDailyBasis;
  oneTimeDueDate?: string;
  graceDays?: number;
  prorateFirstPeriod?: boolean;
  scheduleItems?: { dueDate: string; amountUzs: number; note?: string }[];
};

export type AgreementBody = {
  model: DoctorFinanceModel;
  effectiveFrom: string;
  clinicPercent?: number;
  rent?: RentTermsBody;
  serviceRules?: { serviceId: string; clinicPercent: number }[];
  notes?: string;
};

export type SaveAgreementBody = AgreementBody & {
  openingBalance?: { amountUzs: number; asOf?: string; note?: string };
  priorPayment?: {
    amountUzs: number;
    paidAt: string;
    coveredFrom?: string;
    coveredTo?: string;
    method?: RentPaymentMethod;
    note?: string;
  };
};

export type DoctorAgreement = {
  id: string;
  version: number;
  model: DoctorFinanceModel;
  status: 'ACTIVE' | 'SUPERSEDED' | 'ENDED';
  effectiveFrom: string;
  effectiveTo: string | null;
  clinicPercent: number;
  doctorPercent: number;
  rent: (Omit<RentTermsBody, 'amountUzs' | 'scheduleItems'> & {
    amountUzs: number | null;
    graceDays: number;
    prorateFirstPeriod: boolean;
    scheduleItems: { dueDate: string; amountUzs: number; note: string | null }[];
  }) | null;
  serviceRules: { serviceId: string; clinicPercent: number }[];
  notes?: string | null;
  createdAt: string;
  createdBy?: string | null;
  supersededAt: string | null;
};

export type RentObligation = {
  id: string;
  kind: 'RENT' | 'OPENING_BALANCE';
  agreementVersion: number | null;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  amountUzs: number;
  paidUzs: number;
  outstandingUzs: number;
  status: RentObligationStatus;
  daysOverdue: number;
  prorated: boolean;
  note: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  cancelledBy: string | null;
};

export type RentPayment = {
  id: string;
  kind: 'PAYMENT' | 'PRIOR';
  status: 'SUBMITTED' | 'CONFIRMED' | 'REJECTED' | 'VOIDED';
  amountUzs: number;
  allocatedUzs: number;
  unallocatedUzs: number;
  paidAt: string;
  paidDate: string;
  method: RentPaymentMethod;
  note: string | null;
  attachmentUrl: string | null;
  coveredFrom: string | null;
  coveredTo: string | null;
  createdBy?: string | null;
  confirmedBy?: string | null;
  voidedAt: string | null;
  voidedBy?: string | null;
  voidReason: string | null;
  createdAt: string;
  allocations: {
    obligationId: string;
    amountUzs: number;
    dueDate: string;
    periodStart: string;
    periodEnd: string;
    kind: 'RENT' | 'OPENING_BALANCE';
  }[];
};

export type AgingBuckets = { d0_7: number; d8_30: number; d31_60: number; d60_plus: number };

export type RevenueShareTotals = {
  collectedUzs: number;
  clinicShareUzs: number;
  doctorShareUzs: number;
  clinicOwesDoctorUzs: number;
  doctorOwesClinicUzs: number;
};

export type DoctorFinanceDetail = {
  doctor: {
    doctorId: string;
    doctorClinicId: string;
    name: string;
    photoUrl: string | null;
    isActive: boolean;
    startedAt: string;
    endedAt: string | null;
  };
  clinic: { id: string; name: string; timezone: string };
  today: string;
  configured: boolean;
  agreement: DoctorAgreement | null;
  history?: DoctorAgreement[];
  summary: {
    totalDebtUzs: number;
    overdueUzs: number;
    upcomingUzs: number;
    advanceUzs: number;
    nextDue: { date: string; amountUzs: number; obligationId: string | null } | null;
    aging: AgingBuckets;
    pendingSubmissions: number;
    status: DoctorRentRowStatus;
  };
  obligations: RentObligation[];
  payments: RentPayment[];
  revenueShare: {
    month: RevenueShareTotals;
    allTime: RevenueShareTotals;
    entries: {
      id: string;
      kind: 'ACCRUAL' | 'REVERSAL';
      amountUzs: number;
      clinicShareUzs: number;
      doctorShareUzs: number;
      clinicPercent: number;
      collectedBy: 'CLINIC' | 'DOCTOR';
      occurredAt: string;
      reason: string | null;
      patientName: string | null;
      serviceName: string | null;
    }[];
  };
};

export type DoctorRentOverviewRow = {
  doctorId: string;
  doctorClinicId: string;
  name: string;
  photoUrl: string | null;
  isActive: boolean;
  agreement: {
    model: DoctorFinanceModel;
    clinicPercent: number;
    rentAmountUzs: number | null;
    recurrence: RentRecurrence | null;
    dueDayOfMonth: number | null;
    dueDayOfWeek: number | null;
    intervalValue: number | null;
    intervalUnit: RentIntervalUnit | null;
    dailyBasis: RentDailyBasis | null;
    effectiveFrom: string;
  } | null;
  nextDue: { date: string; amountUzs: number } | null;
  debtUzs: number;
  overdueUzs: number;
  upcomingUzs: number;
  advanceUzs: number;
  status: DoctorRentRowStatus;
};

export type DoctorRentOverview = {
  today: string;
  month: { from: string; to: string };
  metrics: {
    expectedThisMonthUzs: number;
    paidThisMonthUzs: number;
    remainingThisMonthUzs: number;
    overdueUzs: number;
    next7DaysUzs: number;
    totalDebtUzs: number;
    advanceUzs: number;
  };
  aging: AgingBuckets;
  counts: Record<'all' | DoctorRentRowStatus, number>;
  missingAgreements: number;
  rows: DoctorRentOverviewRow[];
};

export type DoctorRentReport = {
  from: string;
  to: string;
  totals: {
    accruedUzs: number;
    paidUzs: number;
    debtUzs: number;
    overdueUzs: number;
    revenueCollectedUzs: number;
    revenueDoctorShareUzs: number;
    revenueClinicShareUzs: number;
  };
  rows: {
    doctorId: string;
    name: string;
    isActive: boolean;
    model: DoctorFinanceModel | null;
    status: DoctorRentRowStatus;
    accruedUzs: number;
    paidUzs: number;
    debtUzs: number;
    overdueUzs: number;
    advanceUzs: number;
    revenueCollectedUzs: number;
    revenueClinicShareUzs: number;
    revenueDoctorShareUzs: number;
  }[];
};

export type RentReminderSettings = {
  remind3Days: boolean;
  remind1Day: boolean;
  remindDueDay: boolean;
  remindOverdue: boolean;
  overdueFrequency: 'DAILY' | 'EVERY_3_DAYS' | 'WEEKLY' | 'CUSTOM';
  overdueCustomDays: number | null;
  notifyDoctor: boolean;
  notifyStaff: boolean;
  sendHour: number;
};

export type RecordRentPaymentBody = {
  amountUzs: number;
  paidAt?: string;
  method: RentPaymentMethod;
  note?: string;
  attachmentUrl?: string;
};

export type ClinicRoom = {
  id: string;
  name: string;
  number: string;
  doctorId?: string;
  doctorName?: string;
  status: string;
};

export type ClinicServiceItem = {
  id: string;
  clinicServiceId?: string;
  name: string;
  nameKey?: string | null;
  names?: Record<string, string>;
  category: string;
  durationMinutes: number;
  price: number;
  customName?: string | null;
  active?: boolean;
};

export type CatalogServiceItem = {
  id: string;
  key: string;
  name: string;
  names: Record<string, string>;
  category: string;
  defaultDurationMinutes: number;
  defaultPriceUzs: number;
};

export type ClinicFinanceRecord = {
  id: string;
  date: string;
  time?: string;
  patientName?: string;
  doctorName?: string;
  serviceName: string;
  amount: number;
  type: 'income' | 'expense';
  paymentStatus: string;
  paymentMethod?: string;
  notes?: string;
  category?: string;
  chargeId?: string;
  appointmentId?: string;
  /** Set on refund rows (negative amount); points at the refunded payment. */
  refundOfId?: string;
};

export const EXPENSE_CATEGORIES = [
  'rent',
  'salary',
  'materials',
  'equipment',
  'utilities',
  'marketing',
  'taxes',
  'other',
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export type ClinicExpenseCategory = { id: string; name: string };

export type CreateExpenseBody = {
  amount: number;
  category?: ExpenseCategory;
  categoryId?: string;
  paymentMethod: 'cash' | 'card' | 'transfer';
  date: string;
  serviceName?: string;
  notes?: string;
};

export type ClinicFinanceSummary = {
  period: string;
  revenue: number;
  expenses: number;
  outstanding: number;
  net: number;
  unpaidCharges: number;
  partiallyPaidCharges: number;
};

export type ClinicCharge = {
  id: string;
  appointmentId: string;
  patientId: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'unpaid' | 'partially_paid' | 'paid' | 'cancelled';
  patientName?: string;
  doctorName?: string;
  serviceName?: string;
};

export type ClinicInventoryItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  purchasePrice: number;
  minStock: number;
  supplier: string;
};

export type ClinicWorkingDay = {
  day: number;
  open: string;
  close: string;
  closed?: boolean;
  lunchEnabled?: boolean;
  lunchStart?: string;
  lunchEnd?: string;
};

export type ClinicHoursIssue = {
  day: number;
  field: 'hours' | 'lunch' | 'day';
  code: 'INVALID_TIME' | 'HOURS_ORDER' | 'LUNCH_ORDER' | 'LUNCH_OUTSIDE_HOURS' | 'DUPLICATE_DAY';
};

export type ScheduleConflict = {
  appointmentId: string;
  date: string;
  time: string;
  endTime: string;
  patientName: string;
  doctorName: string;
  reason: 'closed' | 'outside_hours' | 'lunch';
};

export type ClinicBranchInfo = {
  id: string;
  name: string;
  address: string;
  city: string;
  region?: string | null;
  /** Prisma Decimal — serialized as string */
  latitude: string | number;
  longitude: string | number;
  timezone?: string;
  workingHours?: ClinicWorkingDay[] | null;
  isPrimary?: boolean;
};

export type ClinicMe = {
  id: string;
  name: string;
  timezone: string;
  phone?: string | null;
  email?: string | null;
  about?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  specializations?: string[];
  priceFromUzs?: number | null;
  branches?: ClinicBranchInfo[];
};

/** Fired on window after the clinic profile is saved, so other views can refetch. */
export const CLINIC_PROFILE_UPDATED_EVENT = 'clinic-profile-updated';

export type UpdateClinicBody = {
  name?: string;
  phone?: string;
  email?: string;
  about?: string;
  timezone?: string;
  logoUrl?: string;
  coverUrl?: string;
  specializations?: string[];
  priceFromUzs?: number;
  workingHours?: ClinicWorkingDay[];
  location?: {
    address: string;
    city: string;
    region?: string;
    latitude: number;
    longitude: number;
  };
};

export type ClinicNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
};

export type ClinicSearchResult = {
  type: string;
  id: string;
  title: string;
  subtitle?: string;
};

export type ClinicRevenuePoint = {
  date: string;
  revenue: number;
  expenses: number;
  profit: number;
};

export type ClinicRevenueSeries = {
  total: number;
  changePercent: number;
  period: string;
  points: ClinicRevenuePoint[];
};

export type ClinicMember = {
  id: string;
  userId: string;
  role: string;
  isActive: boolean;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  mustChangePassword: boolean;
  permissionOverrides: { permission: string; effect: 'ALLOW' | 'DENY' }[];
  effectivePermissions: string[];
};

export type CreateClinicMemberBody = {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  role: string;
  specialty?: string;
  permissions?: { permission: string; effect: 'ALLOW' | 'DENY' }[];
};

export type CreateClinicMemberResult =
  | { kind: 'created'; temporaryPassword: string; member: ClinicMember }
  | { kind: 'invitation'; activationToken?: string }
  | { kind: 'attached'; displayName: string; member: ClinicMember };

export type ClinicInvitationPreview = {
  clinicName: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  /** The invitee already has an ORADENT account and confirms with its password. */
  existingUser: boolean;
  expiresAt: string;
};

function apiBase(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');
}

export function clinicApiEnabled(): boolean {
  return Boolean(apiBase());
}

async function request<T>(
  path: string,
  init: RequestInit & { token?: string | null } = {},
  retried = false,
): Promise<T> {
  const { token, ...rest } = init;
  const headers = new Headers(rest.headers);
  headers.set('Accept', 'application/json');
  if (rest.body && !(rest.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${apiBase()}${path}`, {
    ...rest,
    headers,
    credentials: 'include',
  });

  if (res.status === 401 && token && !retried) {
    const fresh = await refreshAccessToken(token);
    if (fresh) return request<T>(path, { ...init, token: fresh }, true);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body.message ?? `HTTP ${res.status}`), {
      status: res.status,
      code: body.code,
      details: body.details,
    });
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const clinicApi = {
  dashboard: (token: string) =>
    request<ClinicDashboardStats>('/analytics/dashboard', { token }),
  patientFlow: (token: string, period: string) =>
    request(`/analytics/patient-flow?period=${encodeURIComponent(period)}`, {
      token,
    }),
  appointments: (token: string) =>
    request<ClinicAppointment[]>('/appointments', { token }),
  patients: (token: string, q?: string) =>
    request<ClinicPatient[]>(
      `/patients${q ? `?q=${encodeURIComponent(q)}` : ''}`,
      { token },
    ),
  doctors: async (token: string) => {
    const me = await request<ClinicMe>('/clinics/me', { token });
    return request<ClinicDoctor[]>(
      `/doctors?clinicId=${encodeURIComponent(me.id)}`,
      { token },
    );
  },
  clinicDoctors: (token: string) =>
    request<ClinicDoctorRow[]>('/clinics/me/doctors', { token }),
  createDoctor: (token: string, body: CreateClinicDoctorBody) =>
    request<CreateClinicDoctorResult>('/clinics/me/doctors', {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    }),
  updateDoctor: (token: string, id: string, body: UpdateClinicDoctorBody) =>
    request<{ ok: true }>(`/clinics/me/doctors/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(body),
    }),
  lookupDoctor: (
    token: string,
    body: { phone?: string; firstName?: string; lastName?: string },
  ) =>
    request<DoctorLookupMatch[]>('/clinics/me/doctors/lookup', {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    }),
  removeDoctor: (token: string, id: string, force = false) =>
    request<{ ok: true; upcoming: number }>(
      `/clinics/me/doctors/${encodeURIComponent(id)}${force ? '?force=true' : ''}`,
      { method: 'DELETE', token },
    ),
  resetDoctorPassword: (token: string, id: string) =>
    request<{ ok: true; login: string; temporaryPassword: string }>(
      `/clinics/me/doctors/${encodeURIComponent(id)}/reset-password`,
      { method: 'POST', token },
    ),
  doctorSpecialties: (token: string, locale?: string) =>
    request<ClinicDoctorSpecialty[]>(
      `/clinics/me/specialties${locale ? `?locale=${encodeURIComponent(locale)}` : ''}`,
      { token },
    ),
  createDoctorSpecialty: (token: string, name: string) =>
    request<ClinicDoctorSpecialty>('/clinics/me/specialties', {
      method: 'POST',
      token,
      body: JSON.stringify({ name }),
    }),
  renameDoctorSpecialty: (token: string, id: string, name: string) =>
    request<ClinicDoctorSpecialty>(`/clinics/me/specialties/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ name }),
    }),
  deleteDoctorSpecialty: (token: string, id: string) =>
    request<{ ok: true; affectedDoctors: number }>(`/clinics/me/specialties/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      token,
    }),
  rooms: (token: string) => request<ClinicRoom[]>('/rooms', { token }),
  services: (token: string) =>
    request<ClinicServiceItem[]>('/services', { token }),
  serviceCatalog: (token: string) =>
    request<CatalogServiceItem[]>('/services/catalog', { token }),
  setupServices: (
    token: string,
    services: Array<{
      serviceId: string;
      priceUzs?: number;
      durationMinutes?: number;
      customName?: string;
    }>,
  ) =>
    request<ClinicServiceItem[]>('/services/setup', {
      method: 'POST',
      token,
      body: JSON.stringify({ services }),
    }),
  finance: (token: string, period = 'month') =>
    request<ClinicFinanceRecord[]>(`/finance?period=${period}`, { token }),
  financeSummary: (token: string, period = 'month') =>
    request<ClinicFinanceSummary>(`/finance/summary?period=${period}`, {
      token,
    }),
  createExpense: (token: string, body: CreateExpenseBody) =>
    request<ClinicFinanceRecord>('/finance', {
      method: 'POST',
      token,
      body: JSON.stringify({ type: 'expense', ...body }),
    }),
  expenseCategories: (token: string) =>
    request<ClinicExpenseCategory[]>('/finance/categories', { token }),
  createExpenseCategory: (token: string, name: string) =>
    request<ClinicExpenseCategory>('/finance/categories', {
      method: 'POST',
      token,
      body: JSON.stringify({ name }),
    }),
  charges: (token: string, status?: string) =>
    request<ClinicCharge[]>(
      `/finance/charges${status ? `?status=${encodeURIComponent(status)}` : ''}`,
      { token },
    ),
  payCharge: (
    token: string,
    chargeId: string,
    body: { amount: number; method?: string; notes?: string },
  ) =>
    request<{ charge: ClinicCharge; payment: ClinicFinanceRecord }>(
      `/finance/charges/${encodeURIComponent(chargeId)}/payments`,
      {
        method: 'POST',
        token,
        body: JSON.stringify(body),
      },
    ),
  patientFinance: (token: string, patientId: string) =>
    request<{
      totalDebt: number;
      charges: ClinicCharge[];
      payments: ClinicFinanceRecord[];
    }>(`/finance/patients/${encodeURIComponent(patientId)}`, { token }),
  inventory: (token: string) =>
    request<ClinicInventoryItem[]>('/inventory', { token }),
  clinicMe: (token: string) => request<ClinicMe>('/clinics/me', { token }),
  updateClinic: (token: string, body: UpdateClinicBody) =>
    request<ClinicMe>('/clinics/me', {
      method: 'PATCH',
      token,
      body: JSON.stringify(body),
    }),
  previewScheduleConflicts: (token: string, workingHours: ClinicWorkingDay[]) =>
    request<{ conflicts: ScheduleConflict[]; total: number }>(
      '/clinics/me/working-hours/conflicts',
      { method: 'POST', token, body: JSON.stringify({ workingHours }) },
    ),
  uploadClinicMedia: (token: string, kind: 'logo' | 'cover', file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<ClinicMe>(`/clinics/me/media/${kind}`, {
      method: 'POST',
      token,
      body: form,
    });
  },
  publish: (token: string, body: { isMarketplaceVisible?: boolean }) =>
    request('/clinics/me/publish', {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    }),
  notifications: (token: string) =>
    request<ClinicNotification[]>('/notifications', { token }),
  notificationsUnread: (token: string) =>
    request<{ count: number }>('/notifications/unread-count', { token }),
  notificationRead: (token: string, id: string) =>
    request(`/notifications/${encodeURIComponent(id)}/read`, {
      method: 'PATCH',
      token,
    }),
  notificationsReadAll: (token: string) =>
    request('/notifications/read-all', { method: 'POST', token }),
  registerPushDevice: (
    token: string,
    body: { platform: string; token: string },
  ) =>
    request('/notifications/devices', {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    }),
  unregisterPushDevice: (
    token: string,
    body: { platform: string; token: string },
  ) =>
    request('/notifications/devices/unregister', {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    }),
  revenueSeries: (token: string, period: string) =>
    request<ClinicRevenueSeries>(
      `/analytics/revenue-series?period=${encodeURIComponent(period)}`,
      { token },
    ),
  search: (token: string, q: string, limit = 20) =>
    request<{ q: string; results: ClinicSearchResult[] }>(
      `/search?q=${encodeURIComponent(q)}&limit=${limit}`,
      { token },
    ),
  members: (token: string) => request<ClinicMember[]>('/clinics/me/members', { token }),
  createMember: (token: string, body: CreateClinicMemberBody) =>
    request<CreateClinicMemberResult>('/clinics/me/members', {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    }),
  updateMember: (
    token: string,
    id: string,
    body: { firstName?: string; lastName?: string; role?: string; specialty?: string },
  ) =>
    request<ClinicMember>(`/clinics/me/members/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(body),
    }),
  updateMemberPermissions: (
    token: string,
    id: string,
    permissions: { permission: string; effect: 'ALLOW' | 'DENY' }[],
  ) =>
    request<ClinicMember>(`/clinics/me/members/${encodeURIComponent(id)}/permissions`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ permissions }),
    }),
  deactivateMember: (token: string, id: string) =>
    request<ClinicMember>(`/clinics/me/members/${encodeURIComponent(id)}/deactivate`, {
      method: 'POST',
      token,
    }),
  peekInvitation: (token: string) =>
    request<ClinicInvitationPreview>(`/invitations/${encodeURIComponent(token)}`),
  acceptInvitation: (token: string, password: string) =>
    request<{ ok: true }>(`/invitations/${encodeURIComponent(token)}/accept`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),
  refundPayment: (token: string, paymentId: string, body: { amount: number; reason: string }) =>
    request<ClinicFinanceRecord>(`/finance/payments/${encodeURIComponent(paymentId)}/refund`, {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    }),
  /** Private files need the bearer token, so they are fetched as blobs. */
  privateFile: async (token: string, url: string): Promise<Blob> => {
    const res = await fetch(`${apiBase()}${url}`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    });
    if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status });
    return res.blob();
  },
};

const DF = '/clinics/me/doctor-finance';
const doc = (doctorId: string) => `${DF}/doctors/${encodeURIComponent(doctorId)}`;

function qs(params: Record<string, string | undefined>): string {
  const s = new URLSearchParams(
    Object.entries(params).filter((e): e is [string, string] => Boolean(e[1])),
  ).toString();
  return s ? `?${s}` : '';
}

export const doctorFinanceApi = {
  overview: (token: string, query: { status?: string; q?: string } = {}) =>
    request<DoctorRentOverview>(`${DF}/overview${qs(query)}`, { token }),
  report: (token: string, query: { from?: string; to?: string; doctorId?: string; status?: string }) =>
    request<DoctorRentReport>(`${DF}/report${qs(query)}`, { token }),
  reminderSettings: (token: string) =>
    request<RentReminderSettings>(`${DF}/reminder-settings`, { token }),
  updateReminderSettings: (token: string, body: Partial<RentReminderSettings>) =>
    request<RentReminderSettings>(`${DF}/reminder-settings`, {
      method: 'PUT',
      token,
      body: JSON.stringify(body),
    }),
  detail: (token: string, doctorId: string) =>
    request<DoctorFinanceDetail>(doc(doctorId), { token }),
  saveAgreement: (token: string, doctorId: string, body: SaveAgreementBody) =>
    request<DoctorFinanceDetail>(`${doc(doctorId)}/agreements`, {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    }),
  openingBalance: (
    token: string,
    doctorId: string,
    body: { amountUzs: number; asOf?: string; note?: string },
  ) =>
    request<DoctorFinanceDetail>(`${doc(doctorId)}/opening-balance`, {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    }),
  cancelObligation: (token: string, doctorId: string, obligationId: string, reason: string) =>
    request<DoctorFinanceDetail>(
      `${doc(doctorId)}/obligations/${encodeURIComponent(obligationId)}/cancel`,
      { method: 'POST', token, body: JSON.stringify({ reason }) },
    ),
  uploadReceipt: (token: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<{ url: string }>(`${DF}/receipts`, { method: 'POST', token, body: form });
  },
  receiptBlob: (token: string, url: string) => clinicApi.privateFile(token, url),
  recordPayment: (token: string, doctorId: string, body: RecordRentPaymentBody) =>
    request<DoctorFinanceDetail>(`${doc(doctorId)}/payments`, {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    }),
  patchPayment: (
    token: string,
    doctorId: string,
    paymentId: string,
    body: { method?: RentPaymentMethod; note?: string; attachmentUrl?: string },
  ) =>
    request<DoctorFinanceDetail>(`${doc(doctorId)}/payments/${encodeURIComponent(paymentId)}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(body),
    }),
  voidPayment: (token: string, doctorId: string, paymentId: string, reason: string) =>
    request<DoctorFinanceDetail>(
      `${doc(doctorId)}/payments/${encodeURIComponent(paymentId)}/void`,
      { method: 'POST', token, body: JSON.stringify({ reason }) },
    ),
  confirmPayment: (token: string, doctorId: string, paymentId: string) =>
    request<DoctorFinanceDetail>(
      `${doc(doctorId)}/payments/${encodeURIComponent(paymentId)}/confirm`,
      { method: 'POST', token },
    ),
  rejectPayment: (token: string, doctorId: string, paymentId: string, reason: string) =>
    request<DoctorFinanceDetail>(
      `${doc(doctorId)}/payments/${encodeURIComponent(paymentId)}/reject`,
      { method: 'POST', token, body: JSON.stringify({ reason }) },
    ),
};
