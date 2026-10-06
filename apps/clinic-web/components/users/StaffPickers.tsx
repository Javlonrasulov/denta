'use client';

import { Eye, Minus, PencilLine, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';
import { PAGE_ACCESS, levelsFor, type AccessLevel, type AccessMap } from '@/lib/staff';

const LEVEL_ICONS: Record<AccessLevel, LucideIcon> = {
  none: Minus,
  view: Eye,
  manage: PencilLine,
};

const LEVELS: AccessLevel[] = ['none', 'view', 'manage'];

export function PageAccessPicker({
  value,
  onChange,
  error,
}: {
  value: AccessMap;
  onChange: (next: AccessMap) => void;
  error?: string;
}) {
  const { t } = useTranslation();

  function setAll(level: AccessLevel) {
    onChange(
      Object.fromEntries(
        PAGE_ACCESS.map((p) => [p.key, levelsFor(p).includes(level) ? level : 'none']),
      ),
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500">{t('crm.users.access.hint')}</p>
        <div className="flex items-center gap-1">
          <span className="mr-1 text-xs font-medium text-slate-400">{t('crm.users.access.all')}</span>
          {LEVELS.map((level) => {
            const Icon = LEVEL_ICONS[level];
            return (
              <button
                key={level}
                type="button"
                onClick={() => setAll(level)}
                className="inline-flex h-7 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <Icon className="h-3 w-3" />
                {t(`crm.users.access.${level}`)}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className={cn(
          'divide-y divide-slate-100 overflow-hidden rounded-xl border',
          error ? 'border-red-300' : 'border-slate-200',
        )}
      >
        {PAGE_ACCESS.map((page) => {
          const Icon = page.icon;
          const current = value[page.key] ?? 'none';
          const available = levelsFor(page);
          return (
            <div key={page.key} className="flex items-center gap-3 px-3 py-2.5">
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition',
                  current === 'none' ? 'bg-slate-100 text-slate-400' : 'bg-primary-muted text-primary',
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.9} />
              </span>
              <span
                className={cn(
                  'min-w-0 flex-1 truncate text-sm font-medium',
                  current === 'none' ? 'text-slate-500' : 'text-slate-900',
                )}
              >
                {t(page.labelKey)}
              </span>
              <div
                role="radiogroup"
                aria-label={t(page.labelKey)}
                className="grid shrink-0 grid-cols-3 gap-0.5 rounded-lg bg-slate-100 p-0.5"
              >
                {LEVELS.map((level) => {
                  const LevelIcon = LEVEL_ICONS[level];
                  const enabled = available.includes(level);
                  const selected = current === level;
                  if (!enabled) return <span key={level} aria-hidden />;
                  return (
                    <button
                      key={level}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => onChange({ ...value, [page.key]: level })}
                      className={cn(
                        'inline-flex h-7 items-center justify-center gap-1 rounded-md px-2 text-xs font-medium transition',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
                        selected
                          ? level === 'manage'
                            ? 'bg-primary text-white shadow-sm'
                            : level === 'view'
                              ? 'bg-white text-primary shadow-sm'
                              : 'bg-white text-slate-700 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700',
                      )}
                    >
                      <LevelIcon className="h-3 w-3" strokeWidth={2.2} />
                      <span className="hidden tablet:inline">{t(`crm.users.access.${level}`)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}
