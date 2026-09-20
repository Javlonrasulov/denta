'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/components/providers/AuthProvider';
import { clinicApi } from '@/lib/api/clinic-api';
import { useClinicQuery } from '@/lib/api/useClinicData';
import { NAV_BOTTOM, NAV_CLINIC, NAV_MAIN, NAV_OPS, type NavItem } from '@/lib/nav';
import { cn } from '@/lib/cn';

export const SIDEBAR_EXPANDED_W = 260;
export const SIDEBAR_COLLAPSED_W = 80;
const STORAGE_KEY = 'denta_sidebar_collapsed';

export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw === 'true') setCollapsed(true);
      if (raw === 'false') setCollapsed(false);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const set = useCallback((value: boolean) => {
    setCollapsed(value);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      /* ignore */
    }
  }, []);

  return { collapsed, toggle, set, ready };
}

function NavLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const Icon = item.icon;
  const label = t(item.labelKey);
  const active =
    item.key !== 'help' && (pathname === item.href || pathname.startsWith(item.href + '/'));

  return (
    <div className="group/nav relative">
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-label={label}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'relative flex min-h-11 items-center rounded-xl py-2 text-nav-item transition-colors duration-200',
          collapsed ? 'justify-center px-0' : 'gap-3 px-3',
          active
            ? 'bg-sidebar-active text-white'
            : 'text-sidebar-item hover:bg-white/10',
        )}
      >
        {active && !collapsed ? (
          <span className="absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-sidebar-accent" />
        ) : null}
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
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
            'min-w-0 overflow-hidden whitespace-nowrap leading-[1.35] tracking-normal transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
            collapsed
              ? 'max-w-0 translate-x-1 opacity-0'
              : 'max-w-[160px] translate-x-0 opacity-100',
            active ? 'font-semibold' : 'font-medium',
          )}
          aria-hidden={collapsed}
        >
          {label}
        </span>
      </Link>

      {collapsed ? (
        <span
          role="tooltip"
          className={cn(
            'pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-[60] -translate-y-1/2',
            'whitespace-nowrap rounded-lg border border-white/10 bg-slate-950 px-3 py-1.5 text-[12.5px] font-medium text-white shadow-lg',
            'opacity-0 transition-opacity duration-150 delay-0',
            'group-hover/nav:opacity-100 group-hover/nav:delay-[180ms]',
            'group-focus-within/nav:opacity-100',
          )}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}

function NavSection({
  titleKey,
  items,
  collapsed,
  onNavigate,
}: {
  titleKey: string;
  items: NavItem[];
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className={cn('space-y-1', collapsed && 'space-y-0.5')}>
      <p
        className={cn(
          'overflow-hidden px-3 text-[11px] font-medium uppercase tracking-[0.04em] text-sidebar-muted transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          collapsed
            ? 'mb-0 max-h-0 pb-0 opacity-0'
            : 'mb-0 max-h-8 pb-1.5 opacity-100',
        )}
        aria-hidden={collapsed}
      >
        {t(titleKey)}
      </p>
      {collapsed ? (
        <div className="mx-3 my-1.5 h-px bg-white/10" aria-hidden />
      ) : null}
      {items.map((item) => (
        <NavLink key={item.key} item={item} collapsed={collapsed} onNavigate={onNavigate} />
      ))}
    </div>
  );
}

function SidebarCollapseRow({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const label = collapsed ? t('crm.nav.expand_sidebar') : t('crm.nav.collapse_sidebar');
  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <div className="group/nav relative">
      <button
        type="button"
        onClick={onToggle}
        aria-label={label}
        aria-expanded={!collapsed}
        className={cn(
          'relative flex w-full min-h-11 items-center rounded-xl py-2 text-nav-item font-medium transition-all duration-200',
          collapsed ? 'justify-center px-0' : 'gap-3 px-3',
          'text-sidebar-item hover:bg-white/10 active:scale-[0.98]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40',
        )}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 transition-colors">
          <Icon className="h-4 w-4 text-sidebar-item" strokeWidth={1.85} />
        </span>
        <span
          className={cn(
            'min-w-0 overflow-hidden whitespace-nowrap text-left leading-[1.35] tracking-normal transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
            collapsed
              ? 'max-w-0 translate-x-1 opacity-0'
              : 'max-w-[180px] translate-x-0 opacity-100',
          )}
          aria-hidden={collapsed}
        >
          {label}
        </span>
      </button>

      {collapsed ? (
        <span
          role="tooltip"
          className={cn(
            'pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-[60] -translate-y-1/2',
            'whitespace-nowrap rounded-lg border border-white/10 bg-slate-950 px-3 py-1.5 text-[12.5px] font-medium text-white shadow-lg',
            'opacity-0 transition-opacity duration-150',
            'group-hover/nav:opacity-100 group-hover/nav:delay-[180ms]',
            'group-focus-within/nav:opacity-100',
          )}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}

export function Sidebar({
  onNavigate,
  collapsed = false,
  onToggle,
  showToggle = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggle?: () => void;
  /** Desktop permanent sidebar shows collapse row in footer */
  showToggle?: boolean;
}) {
  const { user } = useAuth();
  const clinicQuery = useClinicQuery('sidebar-clinic', clinicApi.clinicMe);
  const clinicName = clinicQuery.data?.name ?? user?.clinicName ?? '—';

  return (
    <aside
      className={cn(
        'relative flex h-full flex-col border-r border-white/10 bg-sidebar font-sans text-white',
        'transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
        collapsed ? 'w-20' : 'w-[260px]',
      )}
      data-collapsed={collapsed ? 'true' : 'false'}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-teal-500/20 via-teal-500/5 to-transparent" />

      <div
        className={cn(
          'relative flex items-center pt-6 pb-5',
          collapsed ? 'justify-center px-2' : 'gap-3 px-5',
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-lg shadow-indigo-900/30">
          <Building2 className="h-5 w-5 text-white" strokeWidth={2.2} />
        </div>
        <div
          className={cn(
            'min-w-0 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
            collapsed ? 'max-w-0 translate-x-1 opacity-0' : 'max-w-[160px] translate-x-0 opacity-100',
          )}
          aria-hidden={collapsed}
        >
          <p className="whitespace-nowrap text-[17px] font-semibold leading-tight tracking-[-0.01em]">
            DENTA.UZ
          </p>
          <p className="mt-0.5 truncate whitespace-nowrap text-caption text-sidebar-muted">
            {clinicName}
          </p>
        </div>
      </div>

      <nav
        className={cn(
          'relative flex-1 space-y-5 pb-4',
          collapsed ? 'space-y-2 overflow-visible px-2' : 'overflow-y-auto overflow-x-hidden px-3',
        )}
      >
        <NavSection
          titleKey="crm.nav.section_main"
          items={NAV_MAIN}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
        <NavSection
          titleKey="crm.nav.section_clinic"
          items={NAV_CLINIC}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
        <NavSection
          titleKey="crm.nav.section_ops"
          items={NAV_OPS}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      </nav>

      <div
        className={cn(
          'relative shrink-0 space-y-1 border-t border-white/10 pt-4 pb-5',
          collapsed ? 'px-2' : 'px-3',
        )}
      >
        {NAV_BOTTOM.map((item) => (
          <NavLink key={item.key} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}

        {showToggle && onToggle ? (
          <SidebarCollapseRow collapsed={collapsed} onToggle={onToggle} />
        ) : null}
      </div>
    </aside>
  );
}
