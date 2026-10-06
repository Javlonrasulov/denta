'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/components/providers/AuthProvider';
import { cn } from '@/lib/cn';

function formatDate(iso: string | null | undefined, locale: string): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat(locale === 'uz-Cyrl' ? 'uz-Cyrl' : locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

/** `compact` shows only the day count (narrow headers); the full text stays as the accessible name. */
export function TrialBanner({ compact = false }: { compact?: boolean }) {
  const { t, i18n } = useTranslation();
  const { subscription } = useAuth();
  const [open, setOpen] = useState(false);

  const days = subscription?.daysRemaining;
  const visible = subscription?.status === 'trial' && days !== null && days !== undefined;

  const label = useMemo(() => {
    if (!visible) return '';
    return t('clinicAuth.trial.banner', { days });
  }, [visible, days, t]);

  if (!visible) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={compact ? label : undefined}
        title={compact ? label : undefined}
        className={cn(
          'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border text-xs font-semibold tabular-nums transition',
          compact ? 'px-2.5' : 'px-3',
          days !== null && days <= 3
            ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
            : 'border-primary/20 bg-primary/5 text-primary hover:bg-primary/10',
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {compact ? days : label}
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Close"
            onClick={() => setOpen(false)}
          />
          <div
            className={cn(
              'z-50 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/10',
              compact ? 'fixed inset-x-4 top-[4.5rem]' : 'absolute right-0 mt-2 w-72',
            )}
          >
            <p className="text-sm font-semibold text-slate-900">{t('clinicAuth.trial.details_title')}</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">{t('clinicAuth.trial.started')}</dt>
                <dd className="font-medium text-slate-800">
                  {formatDate(subscription?.trialStartedAt, i18n.language)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">{t('clinicAuth.trial.ends')}</dt>
                <dd className="font-medium text-slate-800">
                  {formatDate(subscription?.trialEndsAt, i18n.language)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">{t('clinicAuth.trial.status')}</dt>
                <dd className="font-medium text-primary">{t('clinicAuth.trial.status_trial')}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              {t('clinicAuth.trial.payment_note')}
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
