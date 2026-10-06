'use client';

import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';
import { DEFAULT_LOCALE, isLocaleCode, type LocaleCode } from '@/lib/i18n/locale';

// Browser ICU data for Uzbek is incomplete, so names are kept here.
const MONTHS: Record<LocaleCode, string[]> = {
  uz: ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'],
  'uz-Cyrl': ['Январ', 'Феврал', 'Март', 'Апрел', 'Май', 'Июн', 'Июл', 'Август', 'Сентабр', 'Октабр', 'Ноябр', 'Декабр'],
  ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

const WEEKDAYS: Record<LocaleCode, string[]> = {
  uz: ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'],
  'uz-Cyrl': ['Ду', 'Се', 'Чо', 'Па', 'Жу', 'Ша', 'Як'],
  ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
  en: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
};

const POPOVER_W = 304;
const POPOVER_GAP = 6;

type Ymd = { y: number; m: number; d: number };

function parseIso(iso: string): Ymd | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]) - 1, d: Number(match[3]) };
}

function toIso({ y, m, d }: Ymd): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function shiftDays(iso: string, days: number): string {
  const p = parseIso(iso)!;
  const date = new Date(p.y, p.m, p.d + days);
  return toIso({ y: date.getFullYear(), m: date.getMonth(), d: date.getDate() });
}

function todayIso(): string {
  const now = new Date();
  return toIso({ y: now.getFullYear(), m: now.getMonth(), d: now.getDate() });
}

/** 6×7 grid starting on Monday. */
function monthGrid(y: number, m: number): Ymd[] {
  const first = new Date(y, m, 1);
  const offset = (first.getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(y, m, 1 - offset + i);
    return { y: date.getFullYear(), m: date.getMonth(), d: date.getDate() };
  });
}

export function formatPickerDate(iso: string, locale: string): string {
  const p = parseIso(iso);
  if (!p) return iso;
  const code: LocaleCode = isLocaleCode(locale) ? locale : DEFAULT_LOCALE;
  const month = MONTHS[code][p.m];
  if (code === 'en') return `${p.d} ${month} ${p.y}`;
  if (code === 'ru') return `${p.d} ${month.toLowerCase()} ${p.y}`;
  return `${p.d}-${month.toLowerCase()}, ${p.y}`;
}

export function DatePicker({
  label,
  value,
  onChange,
  min,
  max,
  error,
}: {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  min?: string;
  max?: string;
  error?: string;
}) {
  const { t, i18n } = useTranslation();
  const locale: LocaleCode = isLocaleCode(i18n.language) ? i18n.language : DEFAULT_LOCALE;
  const triggerId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const selected = parseIso(value);
  const today = todayIso();
  const [view, setView] = useState(() => {
    const base = selected ?? parseIso(today)!;
    return { y: base.y, m: base.m };
  });

  const isDisabled = useCallback(
    (iso: string) => (min !== undefined && iso < min) || (max !== undefined && iso > max),
    [min, max],
  );

  const place = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const height = popoverRef.current?.offsetHeight ?? 380;
    const fitsBelow = rect.bottom + POPOVER_GAP + height <= window.innerHeight - 8;
    const top = fitsBelow
      ? rect.bottom + POPOVER_GAP
      : Math.max(8, rect.top - POPOVER_GAP - height);
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - POPOVER_W - 8);
    setPos({ top, left });
  }, []);

  function openPicker() {
    const base = selected ?? parseIso(today)!;
    setView({ y: base.y, m: base.m });
    setOpen(true);
  }

  const close = useCallback((refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  }, []);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, view, place]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (popoverRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      close(false);
    };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, place, close]);

  useEffect(() => {
    if (!open) return;
    const target =
      popoverRef.current?.querySelector<HTMLButtonElement>('[data-selected="true"]') ??
      popoverRef.current?.querySelector<HTMLButtonElement>('[data-today="true"]');
    target?.focus();
  }, [open]);

  function pick(iso: string) {
    if (isDisabled(iso)) return;
    onChange(iso);
    close();
  }

  function moveMonth(delta: number) {
    setView(({ y, m }) => {
      const date = new Date(y, m + delta, 1);
      return { y: date.getFullYear(), m: date.getMonth() };
    });
  }

  function onPopoverKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.preventDefault();
      // Keep the surrounding modal open.
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
      close();
      return;
    }
    const steps: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    const step = steps[e.key];
    const current = (document.activeElement as HTMLElement | null)?.dataset.iso;
    if (!step || !current) return;
    e.preventDefault();
    const next = shiftDays(current, step);
    if (isDisabled(next)) return;
    const p = parseIso(next)!;
    if (p.y !== view.y || p.m !== view.m) setView({ y: p.y, m: p.m });
    requestAnimationFrame(() => {
      popoverRef.current?.querySelector<HTMLButtonElement>(`[data-iso="${next}"]`)?.focus();
    });
  }

  const grid = monthGrid(view.y, view.m);
  const monthFirst = toIso({ y: view.y, m: view.m, d: 1 });
  const canPrev = min === undefined || shiftDays(monthFirst, -1) >= min;
  const nextMonth = new Date(view.y, view.m + 1, 1);
  const canNext =
    max === undefined ||
    toIso({ y: nextMonth.getFullYear(), m: nextMonth.getMonth(), d: 1 }) <= max;
  const yesterday = shiftDays(today, -1);

  return (
    <div className="space-y-1.5">
      <label htmlFor={triggerId} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => (open ? close(false) : openPicker())}
        className={cn(
          'flex h-12 w-full items-center gap-2.5 rounded-xl border px-3.5 text-left text-sm text-slate-900 outline-none transition',
          'focus-visible:border-primary focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-primary/20',
          error
            ? 'border-red-400 bg-slate-50/80'
            : open
              ? 'border-primary bg-white ring-2 ring-primary/20'
              : 'border-slate-200 bg-slate-50/80 hover:border-slate-300',
        )}
      >
        <CalendarDays className={cn('h-4 w-4 shrink-0', open ? 'text-primary' : 'text-slate-400')} />
        <span className={cn('min-w-0 flex-1 truncate', !value && 'text-slate-400')}>
          {value ? formatPickerDate(value, locale) : t('crm.datepicker.placeholder')}
        </span>
        {value === today ? (
          <span className="shrink-0 rounded-md bg-primary-muted px-2 py-0.5 text-xs font-semibold text-primary">
            {t('crm.datepicker.today')}
          </span>
        ) : null}
      </button>
      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}

      {open
        ? createPortal(
            <div
              ref={popoverRef}
              role="dialog"
              aria-label={label}
              onKeyDown={onPopoverKeyDown}
              style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, width: POPOVER_W }}
              className="fixed z-[60] rounded-2xl border border-slate-200 bg-white p-3 font-sans shadow-xl shadow-slate-900/10"
            >
              <div className="flex items-center justify-between px-1 pb-2">
                <p className="text-sm font-semibold text-slate-900">
                  {MONTHS[locale][view.m]} {view.y}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveMonth(-1)}
                    disabled={!canPrev}
                    aria-label={t('crm.datepicker.prev_month')}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveMonth(1)}
                    disabled={!canNext}
                    aria-label={t('crm.datepicker.next_month')}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 pb-1">
                {WEEKDAYS[locale].map((w, i) => (
                  <span
                    key={w}
                    className={cn(
                      'flex h-8 items-center justify-center text-xs font-medium',
                      i >= 5 ? 'text-rose-400' : 'text-slate-400',
                    )}
                  >
                    {w}
                  </span>
                ))}
              </div>

              <div role="grid" className="grid grid-cols-7 gap-1">
                {grid.map((day) => {
                  const iso = toIso(day);
                  const inMonth = day.m === view.m;
                  const isSelected = iso === value;
                  const isToday = iso === today;
                  const disabled = isDisabled(iso);
                  return (
                    <button
                      key={iso}
                      type="button"
                      data-iso={iso}
                      data-selected={isSelected || undefined}
                      data-today={isToday || undefined}
                      tabIndex={isSelected || (!selected && isToday) ? 0 : -1}
                      disabled={disabled}
                      aria-pressed={isSelected}
                      onClick={() => pick(iso)}
                      className={cn(
                        'flex h-9 items-center justify-center rounded-lg text-sm tabular-nums outline-none transition',
                        'focus-visible:ring-2 focus-visible:ring-primary/40',
                        isSelected
                          ? 'bg-primary font-semibold text-white shadow-md shadow-primary/25'
                          : disabled
                            ? 'cursor-not-allowed text-slate-300'
                            : isToday
                              ? 'bg-primary-muted font-semibold text-primary hover:bg-primary/10'
                              : inMonth
                                ? 'text-slate-700 hover:bg-slate-100'
                                : 'text-slate-400 hover:bg-slate-50',
                      )}
                    >
                      {day.d}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                {[
                  { iso: today, label: t('crm.datepicker.today') },
                  { iso: yesterday, label: t('crm.datepicker.yesterday') },
                ].map((q) => (
                  <button
                    key={q.iso}
                    type="button"
                    disabled={isDisabled(q.iso)}
                    onClick={() => pick(q.iso)}
                    className={cn(
                      'inline-flex h-8 flex-1 items-center justify-center rounded-lg border text-xs font-semibold transition disabled:opacity-40',
                      value === q.iso
                        ? 'border-primary/30 bg-primary-muted text-primary'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                    )}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
