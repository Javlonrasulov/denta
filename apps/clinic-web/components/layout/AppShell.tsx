'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Sidebar,
  SIDEBAR_COLLAPSED_W,
  SIDEBAR_EXPANDED_W,
  useSidebarCollapsed,
} from './Sidebar';
import { TopHeader } from './TopHeader';

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const { collapsed, toggle, set, ready } = useSidebarCollapsed();

  // Tablet (below laptop breakpoint uses drawer; at laptop default can start collapsed once)
  useEffect(() => {
    if (!ready) return;
    const mq = window.matchMedia('(min-width: 768px) and (max-width: 1279px)');
    // Only auto-collapse on first visit when no preference was stored
    const stored = window.localStorage.getItem('denta_sidebar_collapsed');
    if (stored === null && mq.matches) {
      set(true);
    }
  }, [ready, set]);

  const desktopWidth = collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_EXPANDED_W;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div
        className="sticky top-0 z-40 hidden h-screen shrink-0 overflow-visible transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] laptop:block"
        style={{ width: desktopWidth }}
      >
        <Sidebar collapsed={collapsed} onToggle={toggle} showToggle />
      </div>

      {open ? (
        <div className="fixed inset-0 z-40 laptop:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/45"
            aria-label={t('crm.header.close_menu')}
            onClick={() => setOpen(false)}
          />
          <div className="relative h-full w-[min(260px,90vw)] shadow-2xl">
            <Sidebar onNavigate={() => setOpen(false)} collapsed={false} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col transition-[margin] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]">
        <TopHeader
          title={title}
          subtitle={subtitle}
          onMenuClick={() => setOpen(true)}
        />
        <main className="flex-1 w-full px-4 py-6 tablet:px-6 laptop:px-8 desktop:px-10">
          <div className="w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
