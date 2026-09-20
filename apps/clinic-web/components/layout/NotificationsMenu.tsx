'use client';

import {
  AlertTriangle,
  Bell,
  CalendarDays,
  Check,
  Coins,
  Package,
  UserPlus,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';
import {
  clinicApi,
  clinicApiEnabled,
  type ClinicNotification,
} from '@/lib/api/clinic-api';
import { readPersistedSession } from '@/lib/auth/session';

type NotifKind =
  | 'appointment_reminder'
  | 'new_patient'
  | 'low_inventory'
  | 'payment'
  | 'booking_confirmed'
  | 'schedule_changed'
  | 'system';

interface AppNotification {
  id: string;
  type: NotifKind;
  title: string;
  body: string;
  time: string;
  href: string;
  read: boolean;
}

const ICON_BY_TYPE: Record<NotifKind, typeof Bell> = {
  appointment_reminder: CalendarDays,
  new_patient: UserPlus,
  low_inventory: Package,
  payment: Coins,
  booking_confirmed: Check,
  schedule_changed: CalendarDays,
  system: Bell,
};

function mapApiType(type: string): NotifKind {
  const t = type.toUpperCase();
  if (t.includes('PAYMENT')) return 'payment';
  if (t.includes('INVENTORY')) return 'low_inventory';
  if (t.includes('PATIENT')) return 'new_patient';
  if (t.includes('CANCEL') || t.includes('RESCHEDULE')) return 'schedule_changed';
  if (t.includes('APPOINTMENT') || t.includes('BOOKING')) return 'booking_confirmed';
  if (t.includes('REMINDER')) return 'appointment_reminder';
  return 'system';
}

function hrefFor(n: ClinicNotification): string {
  const data = (n.data ?? {}) as Record<string, unknown>;
  if (typeof data.patientId === 'string') return `/patients/${data.patientId}`;
  if (typeof data.appointmentId === 'string') return '/appointments';
  const t = n.type.toUpperCase();
  if (t.includes('INVENTORY')) return '/inventory';
  if (t.includes('PAYMENT')) return '/finance';
  if (t.includes('APPOINTMENT') || t.includes('BOOKING')) return '/appointments';
  return '/overview';
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString();
}

function mapNotification(n: ClinicNotification): AppNotification {
  return {
    id: n.id,
    type: mapApiType(n.type),
    title: n.title,
    body: n.body,
    time: formatTime(n.createdAt),
    href: hrefFor(n),
    read: Boolean(n.read),
  };
}

export function NotificationsMenu() {
  const { t } = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const unread = useMemo(() => items.filter((n) => !n.read).length, [items]);

  const load = useCallback(async () => {
    if (!clinicApiEnabled()) {
      setItems([]);
      return;
    }
    const token = readPersistedSession()?.accessToken;
    if (!token) {
      setItems([]);
      return;
    }
    try {
      const rows = await clinicApi.notifications(token);
      setItems(rows.map(mapNotification));
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  async function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    const token = readPersistedSession()?.accessToken;
    if (!token || !clinicApiEnabled()) return;
    try {
      await clinicApi.notificationsReadAll(token);
    } catch {
      void load();
    }
  }

  async function openItem(item: AppNotification) {
    setItems((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)),
    );
    setOpen(false);
    const token = readPersistedSession()?.accessToken;
    if (token && clinicApiEnabled() && !item.read) {
      try {
        await clinicApi.notificationRead(token, item.id);
      } catch {
        /* ignore */
      }
    }
    router.push(item.href);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={t('crm.header.notifications')}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition',
          open
            ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20'
            : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50',
        )}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 ? (
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
        ) : null}
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label={t('crm.header.notifications')}
          className="absolute right-0 z-50 mt-2 flex w-[min(22rem,calc(100vw-1.5rem))] max-h-[min(28rem,70vh)] flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xl shadow-slate-900/10 ring-1 ring-black/5"
        >
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">
                {t('profile.notifications')}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {unread > 0
                  ? t('notifications.unread_count', { count: unread })
                  : t('notifications.all_read')}
              </p>
            </div>
            {unread > 0 ? (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="shrink-0 text-xs font-semibold text-primary hover:underline"
              >
                {t('notifications.mark_all_read')}
              </button>
            ) : null}
          </div>

          <div className="overflow-y-auto p-1.5">
            {items.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-slate-500">
                {t('notifications.empty')}
              </p>
            ) : (
              items.map((item) => {
                const Icon =
                  item.type === 'low_inventory'
                    ? AlertTriangle
                    : ICON_BY_TYPE[item.type];
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => void openItem(item)}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition',
                      item.read
                        ? 'hover:bg-slate-50'
                        : 'bg-primary/[0.06] hover:bg-primary/10',
                    )}
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                        item.type === 'low_inventory'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-slate-100 text-primary',
                      )}
                    >
                      <Icon className="h-4 w-4" strokeWidth={2.2} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-slate-900">
                          {item.title}
                        </span>
                        <span className="shrink-0 text-[11px] text-slate-400">
                          {item.time}
                        </span>
                      </span>
                      <span className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                        {item.body}
                      </span>
                    </span>
                    {!item.read ? (
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-teal-500" />
                    ) : (
                      <span className="w-2 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
