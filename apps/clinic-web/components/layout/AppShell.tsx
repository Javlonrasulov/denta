'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Sidebar } from './Sidebar';
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

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="sticky top-0 hidden h-screen shrink-0 laptop:block">
        <Sidebar />
      </div>

      {open ? (
        <div className="fixed inset-0 z-40 laptop:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/45"
            aria-label={t('crm.header.close_menu')}
            onClick={() => setOpen(false)}
          />
          <div className="relative h-full w-[min(280px,90vw)] shadow-2xl">
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopHeader
          title={title}
          subtitle={subtitle}
          onMenuClick={() => setOpen(true)}
        />
        <main className="flex-1 px-4 py-6 tablet:px-6 laptop:px-8">
          <div className="mx-auto w-full max-w-content">{children}</div>
        </main>
      </div>
    </div>
  );
}
