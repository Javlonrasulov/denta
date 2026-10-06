'use client';

import { Menu, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { TrialBanner } from '@/components/auth/TrialBanner';
import { WorkspaceSwitcher } from '@/components/auth/WorkspaceSwitcher';
import { LanguageSelector } from '@/components/i18n/LanguageSelector';
import { NotificationsMenu } from '@/components/layout/NotificationsMenu';
import { cn } from '@/lib/cn';

import { HeaderSearch } from './header/HeaderSearch';
import { PageContext } from './header/PageContext';
import { ThemeToggle } from './header/ThemeToggle';
import { UserMenu } from './header/UserMenu';

/** Matches the `desktop` screen — where the inline search input is visible. */
const INLINE_SEARCH_QUERY = '(min-width: 1440px)';

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
}

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
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Ctrl/⌘+K anywhere, or "/" outside text fields, jumps to search.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const combo = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
      const slash = event.key === '/' && !isTypingTarget(event.target);
      if (!combo && !slash) return;
      event.preventDefault();
      if (window.matchMedia(INLINE_SEARCH_QUERY).matches) {
        searchRef.current?.focus();
        searchRef.current?.select();
      } else {
        setSearchOpen(true);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-30 border-b bg-surface/80 font-sans backdrop-blur-xl backdrop-saturate-150 transition-[box-shadow,border-color] duration-200',
        scrolled ? 'border-line shadow-nav' : 'border-line/70',
      )}
    >
      <div className="flex h-16 items-center gap-3 px-4 tablet:h-[var(--header-h)] tablet:px-6 laptop:gap-4 laptop:px-8 desktop:px-10">
        <button
          type="button"
          onClick={onMenuClick}
          className="nav-icon-btn laptop:hidden"
          aria-label={t('crm.header.open_menu')}
        >
          <Menu aria-hidden className="h-[18px] w-[18px]" strokeWidth={1.9} />
        </button>

        <PageContext title={title} subtitle={subtitle} className="flex-1" />

        <div className="flex shrink-0 items-center gap-2 laptop:gap-2.5">
          <HeaderSearch inputRef={searchRef} className="hidden w-64 desktop:block wide:w-72 ultra:w-80" />
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            aria-expanded={searchOpen}
            aria-label={t('crm.header.open_search')}
            title={t('crm.header.open_search')}
            className="nav-icon-btn desktop:hidden"
          >
            {searchOpen ? (
              <X aria-hidden className="h-[18px] w-[18px]" strokeWidth={1.9} />
            ) : (
              <Search aria-hidden className="h-[18px] w-[18px]" strokeWidth={1.9} />
            )}
          </button>

          <WorkspaceSwitcher className="hidden desktop:block" />
          <TrialBanner compact className="hidden tablet:block ultra:hidden" />
          <TrialBanner className="hidden ultra:block" />

          <span aria-hidden className="mx-0.5 hidden h-6 w-px bg-line tablet:block" />

          <LanguageSelector className="hidden tablet:block" />
          <ThemeToggle className="hidden tablet:inline-flex" />
          <NotificationsMenu />
          <UserMenu />
        </div>
      </div>

      {searchOpen ? (
        <div className="border-t border-line/70 px-4 py-3 tablet:px-6 laptop:px-8 desktop:hidden">
          <HeaderSearch autoFocus onSubmitted={() => setSearchOpen(false)} />
        </div>
      ) : null}
    </header>
  );
}
