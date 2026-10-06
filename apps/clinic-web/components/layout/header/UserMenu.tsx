'use client';

import {
  ArrowLeftRight,
  Building2,
  Check,
  ChevronDown,
  LogOut,
  Settings,
  UserCog,
  UserRound,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AdminCabinetModal } from '@/components/account/AdminCabinetModal';
import { setAppLocale } from '@/components/i18n/I18nProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { readPersistedSession } from '@/lib/auth/session';
import { cn } from '@/lib/cn';
import { LOCALE_OPTIONS, resolveLocaleCode } from '@/lib/i18n';
import { handleMenuKeyDown, useDismiss } from '@/lib/use-dismiss';

import { ThemeSegmented } from './ThemeToggle';

type SessionInfo = {
  role: string | null;
  permissions: string[];
  workspaceCount: number;
};

function readSessionInfo(isMock: boolean): SessionInfo {
  const session = readPersistedSession();
  return {
    role: session?.activeWorkspace?.role ?? null,
    permissions: session?.activeWorkspace?.permissions ?? (isMock ? ['*'] : []),
    workspaceCount: session?.workspaces?.length ?? 0,
  };
}

const can = (permissions: string[], ...needed: string[]) =>
  permissions.includes('*') || needed.some((p) => permissions.includes(p));

export function UserAvatar({ initials, size = 'md' }: { initials: string; size?: 'md' | 'lg' }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center bg-gradient-to-br from-primary to-secondary font-semibold tracking-normal text-white shadow-sm ring-1 ring-inset ring-white/15',
        size === 'lg' ? 'h-11 w-11 rounded-xl text-sm' : 'h-8 w-8 rounded-[10px] text-xs',
      )}
    >
      {initials}
    </span>
  );
}

export function UserMenu() {
  const { t, i18n } = useTranslation();
  const { user, logout, isMock, subscription } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [cabinetOpen, setCabinetOpen] = useState(false);
  const [info, setInfo] = useState<SessionInfo>({ role: null, permissions: [], workspaceCount: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const close = useCallback(() => setOpen(false), []);
  const closeCabinet = useCallback(() => setCabinetOpen(false), []);
  useDismiss(open, rootRef, close, triggerRef);

  useEffect(() => {
    setInfo(readSessionInfo(isMock));
  }, [isMock, user]);

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  }, [open]);

  const initials = user
    ? `${user.adminFirstName.charAt(0)}${user.adminLastName.charAt(0)}`.toUpperCase()
    : 'AD';
  const displayName = user
    ? `${user.adminFirstName} ${user.adminLastName}`.trim()
    : t('crm.header.admin');
  const roleLabel = info.role ? t(`crm.users.roles.${info.role}`) : t('crm.header.role_manager');
  const currentLocale = resolveLocaleCode(i18n.resolvedLanguage ?? i18n.language);
  const trialDays =
    subscription?.status === 'trial' && typeof subscription.daysRemaining === 'number'
      ? subscription.daysRemaining
      : null;

  async function onLogout() {
    setOpen(false);
    await logout();
    router.replace('/login');
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={t('crm.header.profile_menu')}
        className={cn(
          'group flex h-10 items-center gap-2 rounded-xl border border-line bg-card pl-1 pr-1 shadow-card outline-none transition-[background-color,border-color,box-shadow] duration-150 tablet:pr-2',
          'hover:border-line-strong hover:bg-hover',
          'focus-visible:ring-2 focus-visible:ring-focus/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
          open && 'border-primary/40 bg-primary/5',
        )}
      >
        <UserAvatar initials={initials} />
        <span className="hidden min-w-0 text-left leading-tight wide:block">
          <span className="block max-w-[140px] truncate text-[13px] font-semibold text-fg">
            {displayName}
          </span>
          <span className="block max-w-[140px] truncate text-[11.5px] text-fg-muted">{roleLabel}</span>
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            'hidden h-3.5 w-3.5 shrink-0 text-fg-subtle transition-transform duration-200 tablet:block',
            open && 'rotate-180',
          )}
          strokeWidth={2.2}
        />
      </button>

      {open ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={t('crm.header.profile_menu')}
          onKeyDown={(e) => {
            handleMenuKeyDown(e);
            if (e.key === 'Tab') close();
          }}
          className="popover-panel absolute right-0 mt-2 w-[min(19rem,calc(100vw-1.5rem))] origin-top-right"
        >
          <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
            <UserAvatar initials={initials} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-fg">{displayName}</p>
              <p className="truncate text-xs text-fg-muted">{user?.email || user?.phone}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 border-b border-line bg-sunken/60 px-4 py-2.5">
            <Building2 aria-hidden className="h-3.5 w-3.5 shrink-0 text-fg-subtle" strokeWidth={2} />
            <span className="min-w-0 flex-1 truncate text-xs font-medium text-fg">
              {user?.clinicName ?? '—'}
            </span>
            <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10.5px] font-semibold text-primary ring-1 ring-inset ring-primary/15">
              {roleLabel}
            </span>
          </div>

          {trialDays !== null ? (
            <p className="border-b border-line px-4 py-2 text-xs font-medium text-fg-muted tablet:hidden">
              {t('clinicAuth.trial.banner', { days: trialDays })}
            </p>
          ) : null}

          <div className="p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                setCabinetOpen(true);
              }}
              className="menu-item"
            >
              <UserRound aria-hidden className="h-4 w-4 shrink-0 text-fg-muted" strokeWidth={2} />
              <span className="min-w-0 flex-1">
                <span className="block truncate">{t('crm.header.account')}</span>
                <span className="block truncate text-[11.5px] font-normal text-fg-subtle">
                  {t('crm.header.account_hint')}
                </span>
              </span>
            </button>
            {can(info.permissions, 'settings:read', 'settings:manage') ? (
              <Link href="/settings" role="menuitem" onClick={close} className="menu-item">
                <Settings aria-hidden className="h-4 w-4 shrink-0 text-fg-muted" strokeWidth={2} />
                <span className="truncate">{t('crm.nav.settings')}</span>
              </Link>
            ) : null}
            {can(info.permissions, 'members:manage') ? (
              <Link href="/users" role="menuitem" onClick={close} className="menu-item">
                <UserCog aria-hidden className="h-4 w-4 shrink-0 text-fg-muted" strokeWidth={2} />
                <span className="truncate">{t('crm.nav.users')}</span>
              </Link>
            ) : null}
            {info.workspaceCount > 1 ? (
              <Link href="/select-workspace" role="menuitem" onClick={close} className="menu-item">
                <ArrowLeftRight aria-hidden className="h-4 w-4 shrink-0 text-fg-muted" strokeWidth={2} />
                <span className="truncate">{t('crm.header.switch_workspace')}</span>
              </Link>
            ) : null}
          </div>

          <div className="border-t border-line pt-1.5">
            <ThemeSegmented />
          </div>

          <div className="border-t border-line p-1.5 tablet:hidden">
            <p className="px-1.5 pb-1 pt-1 text-[11px] font-medium uppercase tracking-[0.06em] text-fg-subtle">
              {t('crm.header.language')}
            </p>
            {LOCALE_OPTIONS.map((option) => (
              <button
                key={option.code}
                type="button"
                role="menuitemradio"
                aria-checked={option.code === currentLocale}
                onClick={() => void setAppLocale(option.code)}
                className="menu-item py-1.5"
              >
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {option.code === currentLocale ? (
                  <Check aria-hidden className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.4} />
                ) : null}
              </button>
            ))}
          </div>

          <div className="border-t border-line p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={() => void onLogout()}
              className="menu-item text-rose-600 hover:bg-rose-50 focus-visible:bg-rose-50"
            >
              <LogOut aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2} />
              <span className="truncate">{t('clinicAuth.expired.logout')}</span>
            </button>
          </div>
        </div>
      ) : null}

      <AdminCabinetModal open={cabinetOpen} onClose={closeCabinet} />
    </div>
  );
}
