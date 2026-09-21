/**
 * Clinic CRM domain API client (non-auth).
 * Uses NEXT_PUBLIC_API_URL — leave unset only for page-level mocks.
 */

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
  chargeId?: string;
  appointmentId?: string;
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

export type ClinicMe = {
  id: string;
  name: string;
  timezone: string;
  branches?: { city: string; isPrimary?: boolean }[];
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

function apiBase(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');
}

export function clinicApiEnabled(): boolean {
  return Boolean(apiBase());
}

async function request<T>(
  path: string,
  init: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, ...rest } = init;
  const headers = new Headers(rest.headers);
  headers.set('Accept', 'application/json');
  if (rest.body) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${apiBase()}${path}`, {
    ...rest,
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body.message ?? `HTTP ${res.status}`), {
      status: res.status,
      code: body.code,
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
};
