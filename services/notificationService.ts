/**
 * Firebase-ready notification stubs.
 * Firebase Cloud Messaging (FCM) will plug in later — do NOT integrate Firebase here.
 * Local scheduling can use expo-notifications when wiring UI.
 */

export type NotificationType =
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'appointment_reminder'
  | 'schedule_changed'
  | 'new_patient'
  | 'payment'
  | 'low_inventory';

const NOTIFICATION_TYPES: NotificationType[] = [
  'booking_confirmed',
  'booking_cancelled',
  'appointment_reminder',
  'schedule_changed',
  'new_patient',
  'payment',
  'low_inventory',
];

/** Request push/local notification permissions. Stub — always grants for mock. */
export async function requestPermissions(): Promise<boolean> {
  // Later: expo-notifications + FCM permission flow
  return true;
}

export function getNotificationTypes(): NotificationType[] {
  return [...NOTIFICATION_TYPES];
}

export interface ScheduleLocalInput {
  type: NotificationType;
  title: string;
  body: string;
  /** ISO date or delay ms — unused in stub */
  triggerAt?: string | number;
  data?: Record<string, unknown>;
}

/** Schedule a local notification. Stub — no-op until expo-notifications is wired. */
export async function scheduleLocal(_input: ScheduleLocalInput): Promise<string> {
  // Later: Notifications.scheduleNotificationAsync(...)
  // Later FCM: remote messages via Firebase Messaging service worker / native module
  return `local-stub-${Date.now()}`;
}
