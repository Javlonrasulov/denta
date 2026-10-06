'use client';

import type { LucideIcon } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';
import { digitsOnly, groupDigits } from '@/lib/doctor-finance';

export function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700">
      {children}
    </label>
  );
}

export function FieldError({ children }: { children?: ReactNode }) {
  return children ? <p className="mt-1.5 text-xs font-medium text-red-600">{children}</p> : null;
}

export function Hint({ children }: { children: ReactNode }) {
  return <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{children}</p>;
}

export function MoneyInput({
  label,
  value,
  onChange,
  error,
  hint,
  large = false,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (digits: string) => void;
  error?: string;
  hint?: string;
  large?: boolean;
  autoFocus?: boolean;
}) {
  const { t } = useTranslation();
  const id = useId();
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div
        className={cn(
          'mt-1.5 flex items-baseline gap-2 rounded-xl border bg-slate-50/80 px-3.5 transition focus-within:border-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20',
          large ? 'h-14' : 'h-12',
          error ? 'border-red-300' : 'border-slate-200',
        )}
      >
        <input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          autoFocus={autoFocus}
          placeholder="0"
          value={groupDigits(value)}
          onChange={(e) => onChange(digitsOnly(e.target.value))}
          aria-invalid={Boolean(error)}
          className={cn(
            'h-full min-w-0 flex-1 bg-transparent font-semibold tabular-nums text-slate-900 outline-none placeholder:text-slate-300',
            large ? 'text-2xl' : 'text-base',
          )}
        />
        <span className="shrink-0 text-sm font-medium text-slate-400">
          {t('crm.doctor_finance.currency')}
        </span>
      </div>
      {error ? <FieldError>{error}</FieldError> : hint ? <Hint>{hint}</Hint> : null}
    </div>
  );
}

export function Segmented<V extends string | number>({
  value,
  onChange,
  options,
  label,
  size = 'md',
}: {
  value: V;
  onChange: (v: V) => void;
  options: { value: V; label: string; icon?: LucideIcon }[];
  label?: string;
  size?: 'sm' | 'md';
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        'grid gap-1 rounded-xl border border-slate-200 bg-slate-50/80 p-1',
        size === 'md' ? 'min-h-12' : 'min-h-10',
      )}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map(({ value: v, label: l, icon: Icon }) => {
        const active = v === value;
        return (
          <button
            key={String(v)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(v)}
            className={cn(
              'inline-flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition',
              active
                ? 'bg-white text-primary shadow-sm ring-1 ring-slate-200'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
            <span className="truncate">{l}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-left transition hover:border-slate-300"
    >
      <span
        className={cn(
          'relative mt-0.5 inline-flex h-5 w-9 shrink-0 rounded-full transition',
          checked ? 'bg-primary' : 'bg-slate-200',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all',
            checked ? 'left-[18px]' : 'left-0.5',
          )}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-900">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{description}</span>
        ) : null}
      </span>
    </button>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 2,
  maxLength = 500,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
}) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <textarea
        id={id}
        rows={rows}
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}

export function StatusPill({ tone, children }: { tone: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
        tone,
      )}
    >
      {children}
    </span>
  );
}
