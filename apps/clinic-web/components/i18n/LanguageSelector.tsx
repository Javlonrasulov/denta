'use client';

import { Check, ChevronDown, Languages } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { setAppLocale } from '@/components/i18n/I18nProvider';
import { cn } from '@/lib/cn';
import { LOCALE_OPTIONS, type LocaleCode } from '@/lib/i18n';

export function LanguageSelector() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const current =
    LOCALE_OPTIONS.find((o) => o.code === i18n.language) ?? LOCALE_OPTIONS[0];

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

  async function selectLocale(code: LocaleCode) {
    setOpen(false);
    if (code === i18n.language) return;
    await setAppLocale(code);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={t('crm.header.language')}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex h-10 items-center gap-1.5 rounded-xl border bg-white px-2.5 text-sm font-semibold tracking-normal text-slate-700 transition',
          open
            ? 'border-primary ring-2 ring-primary/20'
            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
        )}
      >
        <Languages className="h-3.5 w-3.5 text-primary" strokeWidth={2.2} />
        <span>{current.short}</span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-slate-400 transition',
            open && 'rotate-180',
          )}
        />
      </button>

      {open ? (
        <div
          id={listId}
          role="listbox"
          aria-label={t('crm.header.language')}
          className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-xl shadow-slate-900/10 ring-1 ring-black/5"
        >
          {LOCALE_OPTIONS.map((option) => {
            const active = option.code === current.code;
            return (
              <button
                key={option.code}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => void selectLocale(option.code)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition',
                  active
                    ? 'bg-primary/10 font-semibold text-primary'
                    : 'font-medium text-slate-700 hover:bg-slate-50',
                )}
              >
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {active ? (
                  <Check className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />
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
