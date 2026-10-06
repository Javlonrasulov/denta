'use client';

import { LogOut, Menu, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AdminCabinetModal } from '@/components/account/AdminCabinetModal';
import { TrialBanner } from '@/components/auth/TrialBanner';
import { WorkspaceSwitcher } from '@/components/auth/WorkspaceSwitcher';
import { LanguageSelector } from '@/components/i18n/LanguageSelector';
import { NotificationsMenu } from '@/components/layout/NotificationsMenu';
import { useAuth } from '@/components/providers/AuthProvider';

export function TopHeader({
  title,
  subtitle,
  onMenuClick,
}: {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
}) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [cabinetOpen, setCabinetOpen] = useState(false);
  const closeCabinet = useCallback(() => setCabinetOpen(false), []);

  const initials = user
    ? `${user.adminFirstName.charAt(0)}${user.adminLastName.charAt(0)}`.toUpperCase()
    : 'AD';
  const displayName = user
    ? `${user.adminFirstName} ${user.adminLastName}`.trim()
    : t('crm.header.admin');

  async function onLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 font-sans backdrop-blur">
      {/* Below tablet the title wraps to its own row so the actions never squeeze it to zero. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 tablet:h-16 tablet:flex-nowrap tablet:py-0 laptop:gap-4 laptop:px-8">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 laptop:hidden"
          aria-label={t('crm.header.open_menu')}
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="order-last min-w-0 basis-full tablet:order-none tablet:flex-1 tablet:basis-auto">
          <h1 className="truncate text-page-title text-slate-900">{title}</h1>
          {subtitle ? (
            <p className="mt-0.5 hidden truncate text-sm font-normal leading-snug text-slate-500 tablet:block">
              {subtitle}
            </p>
          ) : null}
        </div>

        <div className="hidden items-center gap-2 tablet:flex laptop:gap-3">
          <WorkspaceSwitcher />
          <TrialBanner />

          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder={t('crm.search.placeholder')}
              className="h-10 w-44 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm font-normal tracking-normal text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 laptop:w-72"
            />
          </label>

          <LanguageSelector />

          <NotificationsMenu />

          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white py-1 pl-1 pr-2">
            <button
              type="button"
              onClick={() => setCabinetOpen(true)}
              className="flex min-w-0 items-center gap-2 rounded-lg p-0.5 pr-1.5 text-left transition hover:bg-slate-50"
              aria-label={t('clinicAuth.account.open')}
              title={t('clinicAuth.account.open')}
              aria-haspopup="dialog"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-semibold tracking-normal text-white">
                {initials}
              </span>
              <span className="hidden min-w-0 leading-tight desktop:block">
                <span className="block max-w-[120px] truncate text-sm font-medium tracking-normal text-slate-900">
                  {displayName}
                </span>
                <span className="block truncate text-caption text-slate-500">
                  {user?.clinicName ?? t('crm.header.role_manager')}
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => void onLogout()}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label={t('clinicAuth.expired.logout')}
              title={t('clinicAuth.expired.logout')}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 tablet:hidden">
          <TrialBanner compact />
          <LanguageSelector />
          <NotificationsMenu />
          <button
            type="button"
            onClick={() => setCabinetOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-xs font-semibold text-white"
            aria-label={t('clinicAuth.account.open')}
            aria-haspopup="dialog"
          >
            {initials}
          </button>
          <button
            type="button"
            onClick={() => void onLogout()}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600"
            aria-label={t('clinicAuth.expired.logout')}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
      <AdminCabinetModal open={cabinetOpen} onClose={closeCabinet} />
    </header>
  );
}
