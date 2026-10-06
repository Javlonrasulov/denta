'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/components/providers/ThemeProvider';
import { cn } from '@/lib/cn';
import type { ThemePreference } from '@/lib/theme';

/** One-click light ↔ dark switch. Icons swap via `dark:` so SSR markup never mismatches. */
export function ThemeToggle({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { theme, toggle } = useTheme();
  const label = theme === 'dark' ? t('crm.theme.switch_to_light') : t('crm.theme.switch_to_dark');

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      aria-pressed={theme === 'dark'}
      suppressHydrationWarning
      className={cn('nav-icon-btn overflow-hidden', className)}
    >
      <Moon
        aria-hidden
        className="h-[18px] w-[18px] transition-transform duration-300 dark:-rotate-90 dark:scale-0"
        strokeWidth={1.9}
      />
      <Sun
        aria-hidden
        className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-transform duration-300 dark:rotate-0 dark:scale-100"
        strokeWidth={1.9}
      />
    </button>
  );
}

const OPTIONS: { value: ThemePreference; icon: typeof Sun; key: string }[] = [
  { value: 'light', icon: Sun, key: 'crm.theme.light' },
  { value: 'dark', icon: Moon, key: 'crm.theme.dark' },
  { value: 'system', icon: Monitor, key: 'crm.theme.system' },
];

/** Light / Dark / System segmented control (used inside the profile menu). */
export function ThemeSegmented() {
  const { t } = useTranslation();
  const { preference, setPreference } = useTheme();

  return (
    <div className="px-1.5 pb-1.5 pt-1">
      <p className="px-1.5 pb-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-fg-subtle">
        {t('crm.theme.label')}
      </p>
      <div
        role="group"
        aria-label={t('crm.theme.label')}
        className="grid grid-cols-3 gap-1 rounded-xl bg-sunken p-1 ring-1 ring-inset ring-line"
      >
        {OPTIONS.map(({ value, icon: Icon, key }) => {
          const active = preference === value;
          return (
            <button
              key={value}
              type="button"
              role="menuitemradio"
              aria-checked={active}
              onClick={() => setPreference(value)}
              className={cn(
                'flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold outline-none transition-colors',
                'focus-visible:ring-2 focus-visible:ring-focus/40',
                active
                  ? 'bg-card text-fg shadow-card ring-1 ring-line'
                  : 'text-fg-muted hover:bg-hover hover:text-fg',
              )}
            >
              <Icon aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              <span className="truncate">{t(key)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
