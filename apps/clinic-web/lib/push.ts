'use client';

import { getToken, onMessage } from 'firebase/messaging';

import { clinicApi, clinicApiEnabled } from '@/lib/api/clinic-api';
import { readPersistedSession } from '@/lib/auth/session';
import { getFirebaseMessaging, isFirebaseWebConfigured } from '@/lib/firebase';

let registeredToken: string | null = null;

/**
 * Request browser notification permission, get FCM web token, register with API.
 * Requires NEXT_PUBLIC_FIREBASE_VAPID_KEY (Web Push certificate).
 */
export async function registerClinicWebPush(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (!clinicApiEnabled() || !isFirebaseWebConfigured()) return null;

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim();
  if (!vapidKey) {
    if (process.env.NODE_ENV === 'development') {
      console.info(
        '[push] NEXT_PUBLIC_FIREBASE_VAPID_KEY missing — browser push disabled until Web Push cert is set',
      );
    }
    return null;
  }

  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const messaging = await getFirebaseMessaging();
  if (!messaging) return null;

  // Ensure SW is registered (firebase-messaging-sw.js in /public)
  const registration = await navigator.serviceWorker.register(
    '/firebase-messaging-sw.js',
  );
  await navigator.serviceWorker.ready;

  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });
  if (!token) return null;

  registeredToken = token;
  const session = readPersistedSession();
  if (session?.accessToken) {
    await clinicApi.registerPushDevice(session.accessToken, {
      platform: 'web',
      token,
    });
  }

  // Foreground messages → browser Notification
  onMessage(messaging, (payload) => {
    const title = payload.notification?.title ?? 'DENTA.UZ';
    const body = payload.notification?.body ?? '';
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  });

  return token;
}

export async function unregisterClinicWebPush(): Promise<void> {
  if (!registeredToken) return;
  const session = readPersistedSession();
  if (session?.accessToken) {
    try {
      await clinicApi.unregisterPushDevice(session.accessToken, {
        platform: 'web',
        token: registeredToken,
      });
    } catch {
      /* ignore */
    }
  }
  registeredToken = null;
}
