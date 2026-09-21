import type { Href } from 'expo-router';

import type { InboxNotification } from '@/services/inboxService';

export type NotificationDayGroup = 'today' | 'yesterday' | 'earlier';

export function notificationDayGroup(
  iso: string,
  now = new Date(),
): NotificationDayGroup {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return 'earlier';

  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startYesterday = new Date(startToday);
  startYesterday.setDate(startYesterday.getDate() - 1);

  if (date >= startToday) return 'today';
  if (date >= startYesterday) return 'yesterday';
  return 'earlier';
}

export function formatNotificationTime(iso: string, locale: string): string {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return '';

  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return '·';
  if (mins < 60) return `${mins}m`;

  const hours = Math.floor(mins / 60);
  if (hours < 24 && notificationDayGroup(iso) === 'today') {
    return date.toLocaleTimeString(localeTag(locale), {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (notificationDayGroup(iso) === 'yesterday') {
    return date.toLocaleTimeString(localeTag(locale), {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return date.toLocaleDateString(localeTag(locale), {
    day: 'numeric',
    month: 'short',
  });
}

function localeTag(locale: string): string {
  if (locale === 'uz-Cyrl') return 'uz-Cyrl';
  if (locale === 'uz') return 'uz-Latn';
  if (locale === 'ru') return 'ru-RU';
  return 'en-US';
}

export function hrefForInboxNotification(
  item: InboxNotification,
): Href | null {
  const data = (item.data ?? {}) as Record<string, unknown>;
  const appointmentId =
    typeof data.appointmentId === 'string'
      ? data.appointmentId
      : typeof data.appointment_id === 'string'
        ? data.appointment_id
        : null;

  if (appointmentId) {
    return `/(client)/appointment/${appointmentId}`;
  }

  const type = String(item.type).toUpperCase();
  if (
    type.includes('APPOINTMENT') ||
    type.includes('BOOKING') ||
    type.includes('REMINDER') ||
    type.includes('PAYMENT')
  ) {
    return '/(client)/(tabs)/appointments';
  }

  return null;
}

export function formatUnreadBadge(count: number): string {
  if (count <= 0) return '';
  if (count > 9) return '9+';
  return String(count);
}
