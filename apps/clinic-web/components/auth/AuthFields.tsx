'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';

import { cn } from '@/lib/cn';

export function AuthField({
  label,
  error,
  hint,
  className,
  id,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
}) {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={inputId}
        className={cn(
          'h-12 w-full rounded-xl border bg-slate-50/80 px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400',
          'focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20',
          error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200',
          className,
        )}
        {...rest}
      />
      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
      {!error && hint ? <p className="text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}

export function PasswordField({
  label,
  error,
  showLabel,
  hideLabel,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  showLabel: string;
  hideLabel: string;
}) {
  const [show, setShow] = useState(false);
  const autoId = useId();
  const inputId = rest.id ?? autoId;

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        <input
          {...rest}
          id={inputId}
          type={show ? 'text' : 'password'}
          className={cn(
            'h-12 w-full rounded-xl border bg-slate-50/80 py-2 pl-3.5 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400',
            'focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20',
            error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200',
            rest.className,
          )}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label={show ? hideLabel : showLabel}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}

export function AuthButton({
  children,
  loading,
  variant = 'primary',
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
}) {
  return (
    <button
      type="button"
      disabled={rest.disabled || loading}
      className={cn(
        'inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
        variant === 'primary' &&
          'bg-primary text-white shadow-lg shadow-primary/25 hover:bg-indigo-700',
        variant === 'secondary' &&
          'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
        variant === 'ghost' && 'text-primary hover:bg-primary/5',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      ) : null}
      {children}
    </button>
  );
}

export function PasswordStrengthBar({
  score,
  labels,
}: {
  score: 0 | 1 | 2 | 3;
  labels: { weak: string; ok: string; strong: string };
}) {
  const label = score <= 1 ? labels.weak : score === 2 ? labels.ok : labels.strong;
  const color =
    score <= 1 ? 'bg-red-400' : score === 2 ? 'bg-amber-400' : 'bg-emerald-500';

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition',
              score >= i ? color : 'bg-slate-200',
            )}
          />
        ))}
      </div>
      {score > 0 ? <p className="text-xs text-slate-500">{label}</p> : null}
    </div>
  );
}

export function AuthLinkRow({ children }: { children: ReactNode }) {
  return <p className="text-center text-sm text-slate-500">{children}</p>;
}
