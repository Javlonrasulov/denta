'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';
import { NAV_BOTTOM, NAV_CLINIC, NAV_MAIN, NAV_OPS, type NavItem } from '@/lib/nav';

const SECTIONS: { titleKey: string | null; items: NavItem[] }[] = [
  { titleKey: 'crm.nav.section_main', items: NAV_MAIN },
  { titleKey: 'crm.nav.section_clinic', items: NAV_CLINIC },
  { titleKey: 'crm.nav.section_ops', items: NAV_OPS },
  { titleKey: null, items: NAV_BOTTOM.filter((i) => i.key !== 'help') },
];

function matchRoute(pathname: string) {
  for (const section of SECTIONS) {
    for (const item of section.items) {
      if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
        return { sectionKey: section.titleKey, item, isDetail: pathname !== item.href };
      }
    }
  }
  return null;
}

/** Page icon + title with a breadcrumb/subtitle line — the left side of the top navbar. */
export function PageContext({
  title,
  subtitle,
  className,
}: {
  title: string;
  subtitle?: string;
  className?: string;
}) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const route = useMemo(() => matchRoute(pathname), [pathname]);
  const Icon = route?.item.icon;

  const crumbs: { label: string; href?: string }[] = [];
  if (route?.sectionKey) crumbs.push({ label: t(route.sectionKey) });
  if (route?.isDetail) crumbs.push({ label: t(route.item.labelKey), href: route.item.href });

  return (
    <div className={cn('flex min-w-0 items-center gap-3', className)}>
      {Icon ? (
        <span
          aria-hidden
          className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-secondary/10 text-primary ring-1 ring-inset ring-primary/15 tablet:flex"
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
        </span>
      ) : null}

      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold leading-tight tracking-[-0.012em] text-fg tablet:text-header-title">
          {title}
        </h1>

        {crumbs.length > 0 || subtitle ? (
          <div className="mt-0.5 hidden min-w-0 items-center gap-1.5 text-[12.5px] leading-snug tablet:flex">
            {crumbs.length > 0 ? (
              <nav aria-label={t('crm.header.breadcrumb')} className="shrink-0">
                <ol className="flex items-center gap-1.5">
                  {crumbs.map((crumb, i) => (
                    <li key={crumb.label} className="flex items-center gap-1.5">
                      {i > 0 ? (
                        <ChevronRight aria-hidden className="h-3 w-3 text-fg-subtle" strokeWidth={2.2} />
                      ) : null}
                      {crumb.href ? (
                        <Link
                          href={crumb.href}
                          className="rounded font-medium text-fg-muted outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-focus/40"
                        >
                          {crumb.label}
                        </Link>
                      ) : (
                        <span className="font-medium text-fg-muted">{crumb.label}</span>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            ) : null}
            {crumbs.length > 0 && subtitle ? (
              <span aria-hidden className="h-1 w-1 shrink-0 rounded-full bg-line-strong" />
            ) : null}
            {subtitle ? (
              <p className="min-w-0 truncate text-fg-muted" title={subtitle}>
                {subtitle}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
