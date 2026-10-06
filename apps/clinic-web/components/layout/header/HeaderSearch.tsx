'use client';

import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useState, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';

export const SEARCH_ROUTE = '/patients';

function shortcutLabel(): string {
  if (typeof navigator === 'undefined') return 'Ctrl K';
  return /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘K' : 'Ctrl K';
}

export function HeaderSearch({
  inputRef,
  className,
  autoFocus,
  onSubmitted,
}: {
  inputRef?: RefObject<HTMLInputElement | null>;
  className?: string;
  autoFocus?: boolean;
  onSubmitted?: () => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [value, setValue] = useState('');
  const [shortcut, setShortcut] = useState('Ctrl K');
  const inputId = useId();

  useEffect(() => setShortcut(shortcutLabel()), []);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const q = value.trim();
    router.push(q ? `${SEARCH_ROUTE}?q=${encodeURIComponent(q)}` : SEARCH_ROUTE);
    onSubmitted?.();
  }

  return (
    <form role="search" onSubmit={submit} className={cn('group/search relative', className)}>
      <label className="sr-only" htmlFor={inputId}>
        {t('crm.header.search_label')}
      </label>
      <Search
        aria-hidden
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle transition-colors group-focus-within/search:text-primary"
        strokeWidth={2}
      />
      <input
        id={inputId}
        ref={inputRef}
        type="search"
        value={value}
        autoFocus={autoFocus}
        autoComplete="off"
        enterKeyHint="search"
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            if (value) setValue('');
            else e.currentTarget.blur();
          }
        }}
        placeholder={t('crm.header.search_placeholder')}
        className={cn(
          'peer h-10 w-full rounded-xl border border-line bg-sunken pl-10 pr-9 text-[13.5px] text-fg outline-none wide:pr-16',
          'placeholder:text-fg-subtle transition-[background-color,border-color,box-shadow] duration-150',
          'hover:border-line-strong',
          'focus:border-primary/60 focus:bg-card focus:ring-4 focus:ring-focus/15',
          '[&::-webkit-search-cancel-button]:appearance-none',
        )}
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            setValue('');
            inputRef?.current?.focus();
          }}
          aria-label={t('crm.header.clear_search')}
          className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-fg-subtle outline-none transition hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-focus/40"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.2} />
        </button>
      ) : (
        <kbd
          aria-hidden
          className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 items-center rounded-md border border-line bg-card px-1.5 py-0.5 font-sans text-[10.5px] font-semibold leading-none text-fg-subtle shadow-card peer-focus:opacity-0 wide:inline-flex"
        >
          {shortcut}
        </kbd>
      )}
    </form>
  );
}
