'use client';

import { Check, ChevronDown, Clock3 } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/cn';

const STEP_MINUTES = 15;
const POPOVER_W = 168;
const POPOVER_GAP = 6;
const VIEWPORT_PAD = 8;
const ITEM_H = 32;
const LIST_MAX_H = ITEM_H * 9;
const PAGE_STEP = 60 / STEP_MINUTES;

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function fromMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const BASE_OPTIONS = Array.from({ length: (24 * 60) / STEP_MINUTES }, (_, i) =>
  fromMinutes(i * STEP_MINUTES),
);

export function TimePicker({
  value,
  onChange,
  label,
  disabled,
  invalid,
  isOptionDisabled,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  /** Accessible name; the field shows only the time. */
  label: string;
  disabled?: boolean;
  invalid?: boolean;
  isOptionDisabled?: (time: string) => boolean;
  className?: string;
}) {
  const listId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const typeahead = useRef<{ buffer: string; timer?: ReturnType<typeof setTimeout> }>({ buffer: '' });

  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [active, setActive] = useState(-1);
  const [keyboardNav, setKeyboardNav] = useState(false);

  const options = useMemo(
    () => (BASE_OPTIONS.includes(value) ? BASE_OPTIONS : [...BASE_OPTIONS, value].sort()),
    [value],
  );
  const selectedIndex = options.indexOf(value);
  const optionDisabled = useCallback(
    (i: number) => Boolean(isOptionDisabled?.(options[i])) && options[i] !== value,
    [isOptionDisabled, options, value],
  );
  const optionId = (i: number) => `${listId}-o${i}`;

  const place = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    // clientWidth/Height exclude the page scrollbar, unlike window.inner*.
    const viewW = document.documentElement.clientWidth;
    const viewH = document.documentElement.clientHeight;
    const height = popoverRef.current?.offsetHeight ?? LIST_MAX_H + 12;
    const spaceBelow = viewH - rect.bottom - POPOVER_GAP - VIEWPORT_PAD;
    const spaceAbove = rect.top - POPOVER_GAP - VIEWPORT_PAD;
    const below = spaceBelow >= height || spaceBelow >= spaceAbove;
    const top = below
      ? Math.min(rect.bottom + POPOVER_GAP, viewH - VIEWPORT_PAD - height)
      : Math.max(VIEWPORT_PAD, rect.top - POPOVER_GAP - height);
    const left = Math.min(Math.max(VIEWPORT_PAD, rect.left), viewW - POPOVER_W - VIEWPORT_PAD);
    setPos({ top: Math.max(VIEWPORT_PAD, top), left });
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setPos(null);
  }, []);

  function openPicker() {
    if (disabled) return;
    setActive(selectedIndex);
    setKeyboardNav(false);
    setOpen(true);
  }

  function commit(i: number) {
    if (i < 0 || optionDisabled(i)) return;
    if (options[i] !== value) onChange(options[i]);
    close();
  }

  function step(from: number, delta: number): number {
    const dir = delta > 0 ? 1 : -1;
    let i = Math.min(options.length - 1, Math.max(0, from + delta));
    while (i >= 0 && i < options.length && optionDisabled(i)) i += dir;
    if (i < 0 || i >= options.length) return from;
    return i;
  }

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  // Center the current value once the popover is positioned.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!open || !pos || !list || list.dataset.centered === 'true') return;
    const target = selectedIndex >= 0 ? selectedIndex : 0;
    list.scrollTop = Math.max(0, target * ITEM_H - (list.clientHeight - ITEM_H) / 2);
    list.dataset.centered = 'true';
  }, [open, pos, selectedIndex]);

  useEffect(() => {
    const list = listRef.current;
    if (!open || !keyboardNav || !list || active < 0) return;
    const top = active * ITEM_H;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (top + ITEM_H > list.scrollTop + list.clientHeight) {
      list.scrollTop = top + ITEM_H - list.clientHeight;
    }
  }, [active, keyboardNav, open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (popoverRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      close();
    };
    const onScroll = (e: Event) => {
      if (listRef.current?.contains(e.target as Node)) return;
      place();
    };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open, place, close]);

  useEffect(() => () => clearTimeout(typeahead.current.timer), []);

  function jumpToTyped(digit: string) {
    const ta = typeahead.current;
    clearTimeout(ta.timer);
    ta.buffer = (ta.buffer + digit).slice(-2);
    ta.timer = setTimeout(() => {
      ta.buffer = '';
    }, 900);
    let hour = Number(ta.buffer);
    if (hour > 23) {
      ta.buffer = digit;
      hour = Number(digit);
    }
    const i = options.indexOf(fromMinutes(hour * 60));
    if (i >= 0) {
      setKeyboardNav(true);
      setActive(optionDisabled(i) ? step(i, 1) : i);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        openPicker();
      }
      return;
    }
    const moves: Record<string, number> = {
      ArrowDown: 1,
      ArrowUp: -1,
      PageDown: PAGE_STEP,
      PageUp: -PAGE_STEP,
    };
    if (e.key in moves) {
      e.preventDefault();
      setKeyboardNav(true);
      setActive((a) => step(a < 0 ? selectedIndex : a, moves[e.key]));
      return;
    }
    switch (e.key) {
      case 'Home':
        e.preventDefault();
        setKeyboardNav(true);
        setActive(step(-1, 1));
        return;
      case 'End':
        e.preventDefault();
        setKeyboardNav(true);
        setActive(step(options.length, -1));
        return;
      case 'Enter':
      case ' ':
        e.preventDefault();
        commit(active);
        return;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        close();
        return;
      case 'Tab':
        if (keyboardNav) commit(active);
        close();
        return;
      default:
        if (/^\d$/.test(e.key)) {
          e.preventDefault();
          jumpToTyped(e.key);
        }
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        onClick={() => (open ? close() : openPicker())}
        onKeyDown={onKeyDown}
        onBlur={() => {
          // Window-level blur (switching apps) should not dismiss the list.
          if (open && document.hasFocus()) close();
        }}
        className={cn(
          'group inline-flex h-10 items-center gap-1.5 rounded-lg border bg-white pl-2.5 pr-2 text-sm font-medium tabular-nums text-slate-800 outline-none transition',
          'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20',
          'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
          invalid
            ? 'border-red-300 bg-red-50/40'
            : open
              ? 'border-primary ring-2 ring-primary/20'
              : 'border-slate-200 hover:border-slate-300',
          className,
        )}
      >
        <Clock3
          aria-hidden
          className={cn(
            'hidden h-3.5 w-3.5 shrink-0 tablet:block',
            open ? 'text-primary' : 'text-slate-400',
          )}
        />
        <span className="flex-1 text-left">{value}</span>
        <ChevronDown
          aria-hidden
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-150',
            open && 'rotate-180 text-primary',
          )}
        />
      </button>

      {open
        ? createPortal(
            <div
              ref={popoverRef}
              // Keep focus on the trigger so keyboard handling stays in one place.
              onMouseDown={(e) => e.preventDefault()}
              style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, width: POPOVER_W }}
              className="fixed z-[70] rounded-xl border border-slate-200 bg-white p-1.5 font-sans shadow-xl shadow-slate-900/10"
            >
              <div
                ref={listRef}
                id={listId}
                role="listbox"
                aria-label={label}
                style={{ maxHeight: LIST_MAX_H }}
                className="scrollbar-subtle overflow-y-auto overscroll-contain"
              >
                {options.map((time, i) => {
                  const isSelected = i === selectedIndex;
                  const isActive = i === active;
                  const isDisabled = optionDisabled(i);
                  return (
                    <div
                      key={time}
                      id={optionId(i)}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={isDisabled || undefined}
                      onMouseMove={() => {
                        if (!isDisabled && (active !== i || keyboardNav)) {
                          setKeyboardNav(false);
                          setActive(i);
                        }
                      }}
                      onClick={() => commit(i)}
                      style={{ height: ITEM_H }}
                      className={cn(
                        'flex cursor-pointer select-none items-center justify-between rounded-lg px-3 text-sm tabular-nums transition-colors',
                        isDisabled
                          ? 'cursor-not-allowed text-slate-300'
                          : isSelected
                            ? 'bg-primary-muted font-semibold text-primary'
                            : isActive
                              ? 'bg-slate-100 text-slate-900'
                              : time.endsWith(':00')
                                ? 'text-slate-800'
                                : 'text-slate-500',
                        isActive && keyboardNav && !isDisabled && 'ring-2 ring-inset ring-primary/40',
                      )}
                    >
                      {time}
                      {isSelected ? <Check aria-hidden className="h-3.5 w-3.5" /> : null}
                    </div>
                  );
                })}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
