'use client';

import { KeyRound, ShieldCheck, Smartphone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';

/** A request within this window means the app is open right now. */
const ONLINE_WINDOW_MS = 2 * 60_000;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function dayStart(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

const badgeBase =
  'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset';

export function AppPresence({
  seenAt,
  platform,
  mustChangePassword,
}: {
  seenAt: string | null;
  platform: string | null;
  mustChangePassword: boolean;
}) {
  const { t } = useTranslation();
  const now = useNow(15_000);
  const seen = seenAt ? new Date(seenAt) : null;
  const online = seen !== null && now - seen.getTime() < ONLINE_WINDOW_MS;

  let badge: React.ReactNode;
  if (online) {
    badge = (
      <span className={cn(badgeBase, 'bg-emerald-50 text-emerald-700 ring-emerald-600/20')}>
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        {t('crm.doctors.app.online')}
      </span>
    );
  } else if (!seen) {
    badge = (
      <span className={cn(badgeBase, 'bg-slate-50 text-slate-500 ring-slate-300/60')}>
        <Smartphone className="h-3 w-3" strokeWidth={2.2} />
        {t('crm.doctors.app.never')}
      </span>
    );
  } else if (mustChangePassword) {
    badge = (
      <span
        title={t('crm.doctors.status_default_password_hint')}
        className={cn(badgeBase, 'bg-amber-50 text-amber-700 ring-amber-600/20')}
      >
        <KeyRound className="h-3 w-3" strokeWidth={2.2} />
        {t('crm.doctors.status_default_password')}
      </span>
    );
  } else {
    badge = (
      <span className={cn(badgeBase, 'bg-emerald-50 text-emerald-700 ring-emerald-600/15')}>
        <ShieldCheck className="h-3 w-3" strokeWidth={2.2} />
        {t('crm.doctors.status_active')}
      </span>
    );
  }

  let when = '';
  let exact = '';
  if (seen) {
    const time = `${pad(seen.getHours())}:${pad(seen.getMinutes())}`;
    const days = Math.round((dayStart(new Date(now)) - dayStart(seen)) / 86_400_000);
    const date = `${pad(seen.getDate())}.${pad(seen.getMonth() + 1)}.${seen.getFullYear()}`;
    when =
      days <= 0
        ? t('crm.doctors.app.today', { time })
        : days === 1
          ? t('crm.doctors.app.yesterday', { time })
          : `${date}, ${time}`;
    exact = `${date} ${time}:${pad(seen.getSeconds())}`;
  }
  const device = platform === 'android' ? 'Android' : platform === 'ios' ? 'iOS' : null;

  return (
    <div className="flex min-w-[150px] flex-col items-start gap-1">
      {badge}
      {seen ? (
        <p
          className="whitespace-nowrap text-[11px] text-slate-500"
          title={t('crm.doctors.app.last_seen_exact', { value: exact })}
        >
          {when}
          {device ? <span className="text-slate-400"> · {device}</span> : null}
        </p>
      ) : null}
    </div>
  );
}
