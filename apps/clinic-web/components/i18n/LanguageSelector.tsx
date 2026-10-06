'use client';

import { Check, ChevronDown, Globe } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { setAppLocale } from '@/components/i18n/I18nProvider';
import { cn } from '@/lib/cn';
import { LOCALE_OPTIONS, resolveLocaleCode, type LocaleCode } from '@/lib/i18n';
import { handleMenuKeyDown, useDismiss } from '@/lib/use-dismiss';

export function LanguageSelector({ className }: { className?: string }) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [currentCode, setCurrentCode] = useState<LocaleCode>(() =>
    resolveLocaleCode(i18n.resolvedLanguage ?? i18n.language),
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, rootRef, close, triggerRef);

  const current =
    LOCALE_OPTIONS.find((o) => o.code === currentCode) ?? LOCALE_OPTIONS[0];

  useEffect(() => {
    const sync = (lng?: string) => {
      setCurrentCode(resolveLocaleCode(lng ?? i18n.resolvedLanguage ?? i18n.language));
    };
    sync();
    i18n.on('languageChanged', sync);
    return () => {
      i18n.off('languageChanged', sync);
    };
  }, [i18n]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus();
  }, [open]);

  async function selectLocale(code: LocaleCode) {
    setOpen(false);
    triggerRef.current?.focus();
    if (code === currentCode) return;
    // Optimistic UI — button label updates immediately
    setCurrentCode(code);
    try {
      await setAppLocale(code);
    } catch {
      setCurrentCode(resolveLocaleCode(i18n.resolvedLanguage ?? i18n.language));
    }
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`${t('crm.header.language')}: ${current.label}`}
        title={t('crm.header.language')}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={cn(
          'inline-flex h-10 items-center gap-1.5 rounded-xl border border-line bg-card pl-2.5 pr-2 text-[13px] font-semibold tracking-normal text-fg shadow-card outline-none transition-[background-color,border-color,box-shadow] duration-150',
          'hover:border-line-strong hover:bg-hover',
          'focus-visible:ring-2 focus-visible:ring-focus/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
          open && 'border-primary/40 bg-primary/5',
        )}
      >
        <Globe aria-hidden className="h-4 w-4 text-fg-muted" strokeWidth={1.9} />
        <span className="min-w-[1.5rem] text-center tabular-nums">{current.short}</span>
        <ChevronDown
          aria-hidden
          className={cn('h-3.5 w-3.5 text-fg-subtle transition-transform duration-200', open && 'rotate-180')}
          strokeWidth={2.2}
        />
      </button>

      {open ? (
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={t('crm.header.language')}
          onKeyDown={handleMenuKeyDown}
          className="popover-panel absolute right-0 mt-2 w-56 origin-top-right p-1.5"
        >
          <p className="px-2.5 pb-1.5 pt-1 text-[11px] font-medium uppercase tracking-[0.06em] text-fg-subtle">
            {t('crm.header.language')}
          </p>
          {LOCALE_OPTIONS.map((option) => {
            const active = option.code === current.code;
            return (
              <button
                key={option.code}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => void selectLocale(option.code)}
                className={cn('menu-item gap-3', active && 'bg-primary/10 text-primary hover:bg-primary/10')}
              >
                <span
                  aria-hidden
                  className={cn(
                    'inline-flex h-6 min-w-[2rem] items-center justify-center rounded-md px-1 text-[10.5px] font-bold tracking-wide ring-1 ring-inset',
                    active ? 'bg-primary/10 text-primary ring-primary/25' : 'bg-sunken text-fg-muted ring-line',
                  )}
                >
                  {option.short}
                </span>
                <span className="min-w-0 flex-1 whitespace-nowrap">{option.label}</span>
                {active ? (
                  <Check aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                ) : (
                  <span className="h-4 w-4 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
