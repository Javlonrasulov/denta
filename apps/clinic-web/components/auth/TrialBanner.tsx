'use client';

import { Sparkles } from 'lucide-react';
import { useCallback, useId, useMemo, useRef, useState } from 'react';

import { useAuth } from '@/components/providers/AuthProvider';
import { cn } from '@/lib/cn';
import { useCrmI18n } from '@/lib/i18n/useCrmI18n';
import { useDismiss } from '@/lib/use-dismiss';

function trialProgress(start?: string | null, end?: string | null): number | null {
  if (!start || !end) return null;
  const from = new Date(start).getTime();
  const to = new Date(end).getTime();
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) return null;
  return Math.min(1, Math.max(0, (Date.now() - from) / (to - from)));
}

/** `compact` shows only the day count (narrow headers); the full text stays as the accessible name. */
export function TrialBanner({ compact = false, className }: { compact?: boolean; className?: string }) {
  const { t, date } = useCrmI18n();
  const { subscription } = useAuth();
  const formatDay = (iso: string | null | undefined) => (iso ? date(iso) : '—');
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, rootRef, close, triggerRef);

  const days = subscription?.daysRemaining;
  const visible = subscription?.status === 'trial' && days !== null && days !== undefined;
  const urgent = visible && days <= 3;

  const label = useMemo(() => {
    if (!visible) return '';
    return t('clinicAuth.trial.banner', { days });
  }, [visible, days, t]);

  if (!visible) return null;

  const progress = trialProgress(subscription?.trialStartedAt, subscription?.trialEndsAt);

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        title={compact ? label : undefined}
        className={cn(
          'inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full pl-1 pr-3 text-xs font-semibold tabular-nums outline-none ring-1 ring-inset transition-[background-color,box-shadow] duration-150',
          'focus-visible:ring-2 focus-visible:ring-focus/50',
          urgent
            ? 'bg-amber-50 text-amber-700 ring-amber-200 hover:bg-amber-100'
            : 'bg-gradient-to-r from-primary/10 to-secondary/10 text-primary ring-primary/20 hover:from-primary/15 hover:to-secondary/15',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full text-white shadow-sm',
            urgent ? 'bg-amber-500' : 'bg-gradient-to-br from-primary to-secondary',
          )}
        >
          <Sparkles className="h-3 w-3" strokeWidth={2.4} />
        </span>
        {compact ? t('clinicAuth.trial.days_short', { days }) : label}
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label={t('clinicAuth.trial.details_title')}
          className="popover-panel absolute right-0 mt-2 w-[min(20rem,calc(100vw-1.5rem))] origin-top-right"
        >
          <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white shadow-sm">
              <Sparkles aria-hidden className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-fg">{t('clinicAuth.trial.details_title')}</p>
              <p className={cn('text-xs font-medium', urgent ? 'text-amber-600' : 'text-fg-muted')}>
                {t('clinicAuth.trial.remaining', { days })}
              </p>
            </div>
            <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-primary ring-1 ring-inset ring-primary/15">
              {t('clinicAuth.trial.status_trial')}
            </span>
          </div>

          <div className="space-y-3 px-4 py-3.5">
            {progress !== null ? (
              <div>
                <div className="mb-1.5 flex items-center justify-between text-[11.5px] font-medium text-fg-muted">
                  <span>{t('clinicAuth.trial.progress')}</span>
                  <span className="tabular-nums">{Math.round(progress * 100)}%</span>
                </div>
                <div
                  role="progressbar"
                  aria-label={t('clinicAuth.trial.progress')}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(progress * 100)}
                  className="h-1.5 overflow-hidden rounded-full bg-sunken ring-1 ring-inset ring-line"
                >
                  <div
                    className={cn(
                      'h-full rounded-full',
                      urgent ? 'bg-amber-500' : 'bg-gradient-to-r from-primary to-secondary',
                    )}
                    style={{ width: `${Math.max(4, progress * 100)}%` }}
                  />
                </div>
              </div>
            ) : null}

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-fg-muted">{t('clinicAuth.trial.started')}</dt>
                <dd className="text-right font-medium text-fg">
                  {formatDay(subscription?.trialStartedAt)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-fg-muted">{t('clinicAuth.trial.ends')}</dt>
                <dd className="text-right font-medium text-fg">
                  {formatDay(subscription?.trialEndsAt)}
                </dd>
              </div>
            </dl>

            <p className="rounded-xl bg-sunken px-3 py-2.5 text-xs leading-relaxed text-fg-muted ring-1 ring-inset ring-line">
              {t('clinicAuth.trial.payment_note')}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
