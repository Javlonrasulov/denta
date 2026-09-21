import {
  ApiError,
  apiGet,
  apiPatch,
  apiPost,
  getAccessToken,
  useMockApi,
} from './apiClient';

export type InboxNotificationType =
  | 'APPOINTMENT_CREATED'
  | 'APPOINTMENT_CONFIRMED'
  | 'APPOINTMENT_CANCELLED'
  | 'APPOINTMENT_RESCHEDULED'
  | 'REMINDER'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT'
  | 'SYSTEM'
  | 'LOW_INVENTORY'
  | 'TRIAL_EXPIRING'
  | string;

export type InboxNotification = {
  id: string;
  type: InboxNotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
};

function isAuthFailure(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

export async function getInboxNotifications(): Promise<InboxNotification[]> {
  if (useMockApi()) return [];
  const token = await getAccessToken();
  if (!token) return [];
  try {
    return await apiGet<InboxNotification[]>('/notifications');
  } catch (error) {
    // Stale session / rotated JWT — show empty inbox, not a scary error screen.
    if (isAuthFailure(error)) return [];
    throw error;
  }
}

export async function getUnreadNotificationCount(): Promise<number> {
  if (useMockApi()) return 0;
  const token = await getAccessToken();
  if (!token) return 0;
  try {
    const res = await apiGet<{ count: number }>('/notifications/unread-count');
    return res.count ?? 0;
  } catch (error) {
    if (isAuthFailure(error)) return 0;
    throw error;
  }
}

export async function markNotificationRead(id: string): Promise<void> {
  if (useMockApi()) return;
  const token = await getAccessToken();
  if (!token) return;
  try {
    await apiPatch(`/notifications/${encodeURIComponent(id)}/read`);
  } catch (error) {
    if (isAuthFailure(error)) return;
    throw error;
  }
}

export async function markAllNotificationsRead(): Promise<void> {
  if (useMockApi()) return;
  const token = await getAccessToken();
  if (!token) return;
  try {
    await apiPost('/notifications/read-all');
  } catch (error) {
    if (isAuthFailure(error)) return;
    throw error;
  }
}
