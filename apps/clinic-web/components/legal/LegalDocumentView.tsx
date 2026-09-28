'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LanguageSelector } from '@/components/i18n/LanguageSelector';
import { useAuth } from '@/components/providers/AuthProvider';
import { cn } from '@/lib/cn';
import { resolveLocaleCode } from '@/lib/i18n';
import { getLegalDocument, type LegalDocumentKind } from '@/lib/legal';
import { formatLegalDate } from '@/lib/legal/format';
import type { LegalBlock } from '@/lib/legal/types';

function BlockView({ block }: { block: LegalBlock }) {
  if (block.type === 'ul') {
    return (
      <ul className="list-disc space-y-2 pl-5 marker:text-primary/60">
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }
  if (block.type === 'note') {
    return (
      <p className="rounded-xl border-l-4 border-primary bg-primary-muted/70 px-4 py-3 font-medium text-slate-800 print:border print:bg-transparent">
        {block.text}
      </p>
    );
  }
  return <p>{block.text}</p>;
}

function useActiveSection(ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(ids[0] ?? null);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || ids.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-96px 0px -65% 0px', threshold: 0 },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ids]);

  return active;
}

export function LegalDocumentView({ kind }: { kind: LegalDocumentKind }) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const locale = resolveLocaleCode(i18n.resolvedLanguage ?? i18n.language);
  const doc = useMemo(() => getLegalDocument(kind, locale), [kind, locale]);
  const sectionIds = useMemo(() => doc.sections.map((s) => s.id), [doc]);
  const active = useActiveSection(sectionIds);

  const otherKind: LegalDocumentKind = kind === 'terms' ? 'privacy' : 'terms';
  const fallbackHref = user ? '/overview' : '/register';

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push(fallbackHref);
  }

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur print:static print:border-0">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 tablet:px-8">
          <Link href={fallbackHref} className="group flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white shadow-lg shadow-primary/25 print:shadow-none">
              D
            </span>
            <span className="text-lg font-bold tracking-tight text-primary">DENTA.UZ</span>
          </Link>
          <div className="flex items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="hidden h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 tablet:inline-flex"
            >
              {t('legal.print')}
            </button>
            <LanguageSelector />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 tablet:px-8 print:max-w-none print:px-0 print:pt-0">
        <div className="mb-6 flex flex-wrap items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-primary"
          >
            <span aria-hidden>←</span>
            {t('legal.back')}
          </button>
          <nav className="ml-auto flex rounded-xl border border-slate-200 bg-white p-1 text-sm">
            {(['terms', 'privacy'] as const).map((k) => (
              <Link
                key={k}
                href={`/${k}`}
                aria-current={k === kind ? 'page' : undefined}
                className={cn(
                  'rounded-lg px-3 py-1.5 font-medium transition',
                  k === kind
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-600 hover:text-primary',
                )}
              >
                {t(`legal.${k}_title`)}
              </Link>
            ))}
          </nav>
        </div>

        <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)] print:block">
          <aside className="hidden lg:block print:hidden">
            <nav
              aria-label={t('legal.toc')}
              className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border border-slate-200/80 bg-white p-4"
            >
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {t('legal.toc')}
              </p>
              <ol className="space-y-0.5 text-sm">
                {doc.sections.map((s, i) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className={cn(
                        'flex gap-2 rounded-lg px-2 py-1.5 leading-snug transition',
                        active === s.id
                          ? 'bg-primary-muted font-medium text-primary'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                      )}
                    >
                      <span className="w-5 shrink-0 tabular-nums text-slate-400">{i + 1}.</span>
                      <span>{s.title}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          <article className="min-w-0 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm tablet:p-10 print:border-0 print:p-0 print:shadow-none">
            <header className="border-b border-slate-100 pb-6">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">DENTA.UZ</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 tablet:text-4xl">
                {doc.title}
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-600">{doc.summary}</p>
              <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <div className="flex gap-1.5">
                  <dt className="text-slate-500">{t('legal.effective_date')}:</dt>
                  <dd className="font-medium text-slate-800">
                    {formatLegalDate(doc.effectiveDate, locale)}
                  </dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="text-slate-500">{t('legal.updated_date')}:</dt>
                  <dd className="font-medium text-slate-800">
                    {formatLegalDate(doc.updatedDate, locale)}
                  </dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="text-slate-500">{t('legal.version')}:</dt>
                  <dd className="font-medium tabular-nums text-slate-800">{doc.version}</dd>
                </div>
              </dl>
              {doc.isFallback ? (
                <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 print:hidden">
                  {t('legal.fallback_notice')}
                </p>
              ) : null}
            </header>

            <details className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 lg:hidden print:hidden">
              <summary className="cursor-pointer text-sm font-semibold text-slate-700">
                {t('legal.toc')}
              </summary>
              <ol className="mt-3 space-y-1.5 text-sm">
                {doc.sections.map((s, i) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="flex gap-2 text-slate-600 hover:text-primary">
                      <span className="w-6 shrink-0 tabular-nums text-slate-400">{i + 1}.</span>
                      <span>{s.title}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </details>

            <div lang={doc.locale} className="mt-8 space-y-10">
              {doc.sections.map((s, i) => (
                <section key={s.id} id={s.id} className="scroll-mt-24">
                  <h2 className="flex gap-3 text-xl font-semibold tracking-tight text-slate-900">
                    <span className="tabular-nums text-primary/70">{i + 1}.</span>
                    <span>{s.title}</span>
                  </h2>
                  <div className="mt-4 space-y-4 text-[15px] leading-7 text-slate-700 print:text-[11pt] print:leading-relaxed">
                    {s.blocks.map((b, bi) => (
                      <BlockView key={`${s.id}-${bi}`} block={b} />
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <footer className="mt-12 flex flex-col gap-3 border-t border-slate-100 pt-6 text-sm text-slate-500 tablet:flex-row tablet:items-center tablet:justify-between print:hidden">
              <span>
                © {doc.effectiveDate.slice(0, 4)} DENTA.UZ · {t('legal.version')} {doc.version}
              </span>
              <Link href={`/${otherKind}`} className="font-medium text-primary hover:underline">
                {t(`legal.${otherKind}_title`)} →
              </Link>
            </footer>
          </article>
        </div>
      </div>
    </div>
  );
}
