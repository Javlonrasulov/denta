'use client';

import {
  AlertTriangle,
  Bell,
  BellOff,
  CalendarDays,
  Check,
  CheckCheck,
  Coins,
  Package,
  UserPlus,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/cn';
import { useCrmI18n } from '@/lib/i18n/useCrmI18n';
import { useDismiss } from '@/lib/use-dismiss';
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

const TONE_BY_TYPE: Record<NotifKind, string> = {
  appointment_reminder: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
  new_patient: 'bg-sky-50 text-sky-600 ring-sky-100',
  low_inventory: 'bg-amber-50 text-amber-600 ring-amber-100',
  payment: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  booking_confirmed: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
  schedule_changed: 'bg-violet-50 text-violet-600 ring-violet-100',
  system: 'bg-slate-100 text-slate-600 ring-slate-200',
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

type Formatters = Pick<ReturnType<typeof useCrmI18n>, 't' | 'money' | 'date'>;

const TITLE_KEY_BY_TYPE: Record<string, string> = {
  APPOINTMENT_CREATED: 'appointment_created',
  APPOINTMENT_CANCELLED: 'appointment_cancelled',
  APPOINTMENT_RESCHEDULED: 'appointment_rescheduled',
  PAYMENT_RECEIVED: 'payment_received',
  LOW_INVENTORY: 'low_inventory',
  TRIAL_EXPIRING: 'trial_expiring',
};

function formatTime(iso: string, { t, date }: Formatters): string {
  const created = new Date(iso);
  if (!Number.isFinite(created.getTime())) return '';
  const mins = Math.floor((Date.now() - created.getTime()) / 60_000);
  if (mins < 1) return t('notifications.time.now');
  if (mins < 60) return t('notifications.time.minutes', { count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('notifications.time.hours', { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return t('notifications.time.days', { count: days });
  return date(iso);
}

/**
 * Builds title/body in the active UI language from `type` + structured `data`.
 * Falls back to the stored text (written in the recipient's saved locale) for older rows.
 */
function localizeText(n: ClinicNotification, { t, money, date }: Formatters) {
  const data = (n.data ?? {}) as Record<string, unknown>;
  const str = (key: string) => (typeof data[key] === 'string' ? (data[key] as string) : undefined);
  const num = (key: string) => (typeof data[key] === 'number' ? (data[key] as number) : undefined);
  const type = n.type.toUpperCase();
  const doctor = str('doctorName');
  const amount = num('amountUzs');

  if (type === 'DOCTOR_RENT_REMINDER' && doctor && amount !== undefined) {
    const kind = str('kind');
    if (kind === 'DUE' || kind === 'OVERDUE') {
      const key = kind === 'DUE' ? 'rent_due' : 'rent_overdue';
      return {
        title: t(`notifications.types.${key}.title`),
        body: t(`notifications.types.${key}.body`, {
          doctor,
          amount: money(amount),
          days: num('daysOverdue') ?? 0,
        }),
      };
    }
  }

  const day = str('date');
  if (type === 'DOCTOR_RENT_PAYMENT_SUBMITTED' && doctor && amount !== undefined && day) {
    return {
      title: t('notifications.types.rent_payment_submitted.title'),
      body: t('notifications.types.rent_payment_submitted.body', {
        doctor,
        amount: money(amount),
        date: date(day),
      }),
    };
  }

  const titleKey = TITLE_KEY_BY_TYPE[type];
  const title = titleKey ? t(`notifications.types.${titleKey}.title`) : n.title;

  const patient = str('patientName');
  if (type === 'APPOINTMENT_CREATED' && patient && day) {
    const time = str('time');
    const when = time ? `${date(day)} ${time}` : date(day);
    return {
      title,
      body: [patient, when, str('serviceName')].filter(Boolean).join(' · '),
    };
  }

  return { title, body: n.body };
}

function mapNotification(n: ClinicNotification, fmt: Formatters): AppNotification {
  return {
    id: n.id,
    type: mapApiType(n.type),
    ...localizeText(n, fmt),
    time: formatTime(n.createdAt, fmt),
    href: hrefFor(n),
    read: Boolean(n.read),
  };
}

export function NotificationsMenu() {
  const { t, money, date } = useCrmI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ClinicNotification[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const items = useMemo(
    () => rows.map((n) => mapNotification(n, { t, money, date })),
    [rows, t, money, date],
  );
  const unread = useMemo(() => items.filter((n) => !n.read).length, [items]);

  const load = useCallback(async () => {
    if (!clinicApiEnabled()) {
      setRows([]);
      return;
    }
    const token = readPersistedSession()?.accessToken;
    if (!token) {
      setRows([]);
      return;
    }
    try {
      setRows(await clinicApi.notifications(token));
    } catch {
      setRows([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, rootRef, close, triggerRef);

  async function markAllRead() {
    setRows((prev) => prev.map((n) => ({ ...n, read: true })));
    const token = readPersistedSession()?.accessToken;
    if (!token || !clinicApiEnabled()) return;
    try {
      await clinicApi.notificationsReadAll(token);
    } catch {
      void load();
    }
  }

  async function openItem(item: AppNotification) {
    setRows((prev) =>
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
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={
          unread > 0
            ? `${t('crm.header.notifications')} — ${t('notifications.unread_count', { count: unread })}`
            : t('crm.header.notifications')
        }
        title={t('crm.header.notifications')}
        onClick={() => setOpen((v) => !v)}
        className="nav-icon-btn"
      >
        <Bell aria-hidden className="h-[18px] w-[18px]" strokeWidth={1.9} />
        {unread > 0 ? (
          <span
            aria-hidden
            className="absolute -right-1.5 -top-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white tabular-nums ring-2 ring-canvas"
          >
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label={t('crm.header.notifications')}
          className="popover-panel absolute right-0 mt-2 flex max-h-[min(30rem,72vh)] w-[min(24rem,calc(100vw-1.5rem))] origin-top-right flex-col"
        >
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <p className="whitespace-nowrap text-sm font-semibold text-fg">{t('profile.notifications')}</p>
            <span
              className={cn(
                'min-w-0 truncate rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
                unread > 0
                  ? 'bg-primary/10 text-primary ring-primary/15'
                  : 'bg-sunken text-fg-muted ring-line',
              )}
            >
              {unread > 0
                ? t('notifications.unread_count', { count: unread })
                : t('notifications.all_read')}
            </span>
          </div>

          <div className="scrollbar-subtle overflow-y-auto p-1.5">
            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sunken text-fg-subtle ring-1 ring-inset ring-line">
                  <BellOff aria-hidden className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <p className="text-sm font-medium text-fg-muted">{t('notifications.empty')}</p>
              </div>
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
                      'group flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left outline-none transition-colors',
                      'focus-visible:ring-2 focus-visible:ring-focus/40',
                      item.read ? 'hover:bg-hover' : 'bg-primary/[0.05] hover:bg-primary/10',
                    )}
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset',
                        TONE_BY_TYPE[item.type],
                      )}
                    >
                      <Icon aria-hidden className="h-4 w-4" strokeWidth={2.1} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            'truncate text-sm text-fg',
                            item.read ? 'font-medium' : 'font-semibold',
                          )}
                        >
                          {item.title}
                        </span>
                        <span className="shrink-0 text-[11px] tabular-nums text-fg-subtle">
                          {item.time}
                        </span>
                      </span>
                      <span className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-fg-muted">
                        {item.body}
                      </span>
                    </span>
                    {!item.read ? (
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary ring-4 ring-primary/15" />
                    ) : (
                      <span className="w-2 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {unread > 0 ? (
            <div className="border-t border-line p-1.5">
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-primary outline-none transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-focus/40"
              >
                <CheckCheck aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
                <span className="truncate">{t('notifications.mark_all_read')}</span>
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
