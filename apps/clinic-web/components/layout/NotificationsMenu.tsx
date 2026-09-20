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
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';

type NotifKind =
  | 'appointment_reminder'
  | 'new_patient'
  | 'low_inventory'
  | 'payment'
  | 'booking_confirmed'
  | 'schedule_changed';

interface AppNotification {
  id: string;
  type: NotifKind;
  titleKey: string;
  body: string;
  time: string;
  href: string;
  read: boolean;
}

const INITIAL: AppNotification[] = [
  {
    id: 'n1',
    type: 'appointment_reminder',
    titleKey: 'notifications.appointment_reminder',
    body: 'Javlonbek Karimov · 10:00 · Consultation',
    time: '09:15',
    href: '/appointments',
    read: false,
  },
  {
    id: 'n2',
    type: 'new_patient',
    titleKey: 'notifications.new_patient',
    body: 'Shahnoza Ismoilova',
    time: '08:40',
    href: '/patients',
    read: false,
  },
  {
    id: 'n3',
    type: 'low_inventory',
    titleKey: 'notifications.low_inventory',
    body: 'Anesthesia cartridges — 8 boxes left',
    time: '08:05',
    href: '/inventory',
    read: false,
  },
  {
    id: 'n4',
    type: 'payment',
    titleKey: 'notifications.payment',
    body: 'Malika Sobirova · 450,000 UZS',
    time: 'Yesterday',
    href: '/finance',
    read: true,
  },
  {
    id: 'n5',
    type: 'booking_confirmed',
    titleKey: 'notifications.booking_confirmed',
    body: 'Azizbek Toshmatov · Aug 25 · 11:00',
    time: 'Yesterday',
    href: '/appointments',
    read: true,
  },
  {
    id: 'n6',
    type: 'schedule_changed',
    titleKey: 'notifications.schedule_changed',
    body: 'Dr. Dilnoza Karimova — break 13:30–14:30',
    time: '2d',
    href: '/doctors',
    read: true,
  },
];

const ICON_BY_TYPE: Record<NotifKind, typeof Bell> = {
  appointment_reminder: CalendarDays,
  new_patient: UserPlus,
  low_inventory: Package,
  payment: Coins,
  booking_confirmed: Check,
  schedule_changed: CalendarDays,
};

export function NotificationsMenu() {
  const { t } = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(INITIAL);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const unread = useMemo(() => items.filter((n) => !n.read).length, [items]);

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

  function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function openItem(item: AppNotification) {
    setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
    setOpen(false);
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
                onClick={markAllRead}
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
                    onClick={() => openItem(item)}
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
                          {t(item.titleKey)}
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
