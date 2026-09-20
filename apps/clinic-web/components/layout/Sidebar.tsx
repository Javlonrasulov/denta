'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CLINIC_NAME } from '@denta/mocks';
import { NAV_BOTTOM, NAV_CLINIC, NAV_MAIN, NAV_OPS, type NavItem } from '@/lib/nav';
import { cn } from '@/lib/cn';

function NavSection({
  titleKey,
  items,
}: {
  titleKey: string;
  items: NavItem[];
}) {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <div className="space-y-1">
      <p className="px-3 pb-1.5 text-[11px] font-medium uppercase tracking-[0.04em] text-sidebar-muted">
        {t(titleKey)}
      </p>
      {items.map((item) => {
        const Icon = item.icon;
        const active =
          item.key !== 'help' &&
          (pathname === item.href || pathname.startsWith(item.href + '/'));

        return (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              'relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-nav-item transition',
              active
                ? 'bg-sidebar-active text-white'
                : 'text-sidebar-item hover:bg-white/10',
            )}
          >
            {active ? (
              <span className="absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-sidebar-accent" />
            ) : null}
            <span
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                active ? 'bg-cyan-400/25' : 'bg-white/10',
              )}
            >
              <Icon
                className={cn('h-4 w-4', active ? 'text-sidebar-accent' : 'text-sidebar-item')}
                strokeWidth={active ? 2.1 : 1.85}
              />
            </span>
            <span
              className={cn(
                'min-w-0 flex-1 whitespace-normal break-words leading-[1.35] tracking-normal',
                active ? 'font-semibold' : 'font-medium',
              )}
            >
              {t(item.labelKey)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <aside className="relative flex h-full w-[260px] flex-col border-r border-white/10 bg-sidebar font-sans text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-teal-500/20 via-teal-500/5 to-transparent" />

      <div className="relative flex items-center gap-3 px-5 pb-5 pt-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-lg shadow-indigo-900/30">
          <Building2 className="h-5 w-5 text-white" strokeWidth={2.2} />
        </div>
        <div className="min-w-0">
          <p className="text-[17px] font-semibold leading-tight tracking-[-0.01em]">DENTA.UZ</p>
          <p className="mt-0.5 truncate text-caption text-sidebar-muted">{CLINIC_NAME}</p>
        </div>
      </div>

      <nav
        className="relative flex-1 space-y-5 overflow-y-auto px-3 pb-4"
        onClick={onNavigate}
      >
        <NavSection titleKey="crm.nav.section_main" items={NAV_MAIN} />
        <NavSection titleKey="crm.nav.section_clinic" items={NAV_CLINIC} />
        <NavSection titleKey="crm.nav.section_ops" items={NAV_OPS} />
      </nav>

      <div className="relative space-y-1 border-t border-white/10 px-3 py-4" onClick={onNavigate}>
        {NAV_BOTTOM.map((item) => {
          const Icon = item.icon;
          return <BottomNavLink key={item.key} item={item} Icon={Icon} />;
        })}
      </div>
    </aside>
  );
}

function BottomNavLink({
  item,
  Icon,
}: {
  item: NavItem;
  Icon: NavItem['icon'];
}) {
  const { t } = useTranslation();
  return (
    <Link
      href={item.href}
      className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-nav-item font-medium text-sidebar-item transition hover:bg-white/10"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
        <Icon className="h-4 w-4" strokeWidth={1.85} />
      </span>
      <span className="min-w-0 flex-1 whitespace-normal break-words leading-[1.35] tracking-normal">
        {t(item.labelKey)}
      </span>
    </Link>
  );
}
