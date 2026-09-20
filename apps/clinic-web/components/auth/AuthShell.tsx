'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

import { LanguageSelector } from '@/components/i18n/LanguageSelector';
import { cn } from '@/lib/cn';

export function AuthShell({
  children,
  footer,
  className,
  /** Short screens center vertically; long forms (register) scroll naturally. */
  layout = 'center',
}: {
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  layout?: 'center' | 'scroll';
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-slate-50">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(67,56,202,0.12),_transparent_55%),radial-gradient(ellipse_at_bottom_left,_rgba(8,145,178,0.1),_transparent_50%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl"
      />

      <header className="relative z-30 flex shrink-0 items-center justify-between px-4 py-5 tablet:px-8">
        <Link href="/login" className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white shadow-lg shadow-primary/25 transition group-hover:bg-primary/90">
            D
          </span>
          <span className="text-lg font-bold tracking-tight text-primary">DENTA.UZ</span>
        </Link>
        <LanguageSelector />
      </header>

      <main
        className={cn(
          'relative z-0 flex flex-1 justify-center px-4 tablet:px-8',
          layout === 'center'
            ? 'items-center py-8'
            : 'items-start py-6 pb-12',
        )}
      >
        {/* Optical center: slightly above true midpoint (~24px) for short auth screens */}
        <div
          className={cn(
            'w-full max-w-[440px]',
            layout === 'center' && '-translate-y-6',
            className,
          )}
        >
          {children}
          {footer ? (
            <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl shadow-slate-900/[0.06] backdrop-blur tablet:p-8">
      <div className="mb-6 space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 tablet:text-[1.65rem]">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-sm leading-relaxed text-slate-500">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}
