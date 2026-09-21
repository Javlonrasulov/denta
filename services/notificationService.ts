/**
 * Push + local notifications (Expo Notifications + FCM device tokens).
 *
 * Backend sends via Firebase Admin when FIREBASE_* env is set.
 * Device registers native FCM/APNs token at POST /notifications/devices.
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';

import { apiPost, getAccessToken, useMockApi } from './apiClient';

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

let cachedDeviceToken: string | null = null;

export function getNotificationTypes(): NotificationType[] {
  return [...NOTIFICATION_TYPES];
}

async function loadNotifications() {
  return import('expo-notifications');
}

/** Request push/local notification permissions. */
export async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const Notifications = await loadNotifications();
    const current = await Notifications.getPermissionsAsync();
    if (
      current.granted ||
      current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
    ) {
      return true;
    }
    const asked = await Notifications.requestPermissionsAsync();
    return (
      asked.granted ||
      asked.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
    );
  } catch {
    return false;
  }
}

/**
 * Obtain native FCM (Android) / APNs (iOS) device token and register with API.
 * Requires a development/production build with google-services.json (Android).
 */
export async function registerDevicePushToken(): Promise<string | null> {
  if (Platform.OS === 'web' || useMockApi()) return null;

  const granted = await requestPermissions();
  if (!granted) return null;

  try {
    const Notifications = await loadNotifications();

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'DENTA',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4F46E5',
      });
    }

    const device = await Notifications.getDevicePushTokenAsync();
    const token =
      typeof device.data === 'string' ? device.data : String(device.data);
    if (!token) return null;

    cachedDeviceToken = token;
    const access = await getAccessToken();
    if (access) {
      await apiPost('/notifications/devices', {
        platform: Platform.OS,
        token,
      });
    }
    return token;
  } catch (err) {
    if (__DEV__) {
      console.warn('[push] registerDevicePushToken failed', err);
    }
    return null;
  }
}

/** Unregister current device token from API (logout). */
export async function unregisterDevicePushToken(): Promise<void> {
  if (!cachedDeviceToken || useMockApi()) return;
  try {
    await apiPost('/notifications/devices/unregister', {
      platform: Platform.OS,
      token: cachedDeviceToken,
    });
  } catch {
    /* ignore */
  } finally {
    cachedDeviceToken = null;
  }
}

export interface ScheduleLocalInput {
  type: NotificationType;
  title: string;
  body: string;
  /** ISO date or delay ms */
  triggerAt?: string | number;
  data?: Record<string, unknown>;
}

/** Schedule a local notification via expo-notifications. */
export async function scheduleLocal(
  input: ScheduleLocalInput,
): Promise<string> {
  if (Platform.OS === 'web') {
    return `local-web-${Date.now()}`;
  }
  try {
    const Notifications = await loadNotifications();
    await requestPermissions();

    let trigger: Parameters<
      typeof Notifications.scheduleNotificationAsync
    >[0]['trigger'] = null;

    if (typeof input.triggerAt === 'number') {
      trigger = {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, Math.round(input.triggerAt / 1000)),
      };
    } else if (typeof input.triggerAt === 'string') {
      const at = new Date(input.triggerAt);
      if (!Number.isNaN(at.getTime())) {
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: at,
        };
      }
    }

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: input.title,
        body: input.body,
        data: { type: input.type, ...(input.data ?? {}) },
        sound: true,
      },
      trigger,
    });
  } catch {
    return `local-fallback-${Date.now()}`;
  }
}

/** Whether google-services / Firebase project looks wired in app config. */
export function isFirebaseClientConfigured(): boolean {
  const extra = Constants.expoConfig?.extra as
    | { firebaseConfigured?: boolean }
    | undefined;
  return Boolean(extra?.firebaseConfigured);
}
