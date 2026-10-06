'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { useAuth } from '@/components/providers/AuthProvider';
import { ExpiredPaywall } from '@/components/auth/ExpiredPaywall';
import { ForcePasswordChange } from '@/components/auth/ForcePasswordChange';
import { ALL_NAV_ITEMS } from '@/lib/nav';
import { safeNextPath } from '@/lib/auth/next-path';
import { clearSessionCookie, readPersistedSession } from '@/lib/auth/session';
import type { ClinicAuthUser } from '@/lib/auth/types';

const PUBLIC_PREFIXES = [
  '/login',
  '/register',
  '/verify-email',
  '/verify-success',
  '/forgot-password',
  '/invite',
];

/** Readable by everyone, signed in or not — never redirected, no paywall. */
const LEGAL_PREFIXES = ['/terms', '/privacy'];

function matchesPrefix(path: string, prefixes: string[]): boolean {
  return prefixes.some((p) => path === p || path.startsWith(`${p}/`));
}

function isPublic(path: string): boolean {
  return matchesPrefix(path, PUBLIC_PREFIXES);
}

/** Staff added by phone have no email to verify; the clinic vouched for them. */
function needsEmailVerification(user: ClinicAuthUser): boolean {
  return Boolean(user.email) && !user.emailVerifiedAt;
}

function pathAllowed(pathname: string, permissions: string[]): boolean {
  if (permissions.includes('*')) return true;
  const item = ALL_NAV_ITEMS.find(
    (n) => pathname === n.href || pathname.startsWith(`${n.href}/`),
  );
  if (!item?.permissions?.length) return true;
  return item.permissions.some((p) => permissions.includes(p));
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, ready, loading, getPermissions } = useAuth();
  const router = useRouter();
  const pathname = usePathname() ?? '/';
  const publicRoute = isPublic(pathname);
  const legalRoute = matchesPrefix(pathname, LEGAL_PREFIXES);
  const isOnboarding = pathname === '/onboarding' || pathname.startsWith('/onboarding/');
  const isWorkspaceSelect =
    pathname === '/select-workspace' || pathname.startsWith('/select-workspace/');
  const isInvite = matchesPrefix(pathname, ['/invite']);

  useEffect(() => {
    if (legalRoute || !ready || loading) return;

    if (!user && !publicRoute) {
      // A leftover cookie would make middleware bounce /login back here forever.
      clearSessionCookie();
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (user && publicRoute && pathname !== '/verify-success' && !isInvite) {
      if (needsEmailVerification(user)) {
        if (pathname !== '/verify-email') {
          router.replace(`/verify-email?email=${encodeURIComponent(user.email)}`);
        }
        return;
      }
      if (!user.onboardingCompleted && pathname !== '/onboarding') {
        router.replace('/onboarding');
        return;
      }
      const next =
        pathname === '/login'
          ? safeNextPath(new URLSearchParams(window.location.search).get('next'))
          : null;
      router.replace(next ?? '/overview');
      return;
    }

    if (user && needsEmailVerification(user) && !publicRoute) {
      router.replace(`/verify-email?email=${encodeURIComponent(user.email)}`);
      return;
    }

    if (
      user &&
      !needsEmailVerification(user) &&
      !user.onboardingCompleted &&
      !isOnboarding &&
      !isWorkspaceSelect &&
      !publicRoute
    ) {
      router.replace('/onboarding');
      return;
    }

    // Multi-clinic: force workspace selection before any CRM route.
    if (user && !publicRoute && !isOnboarding && !isWorkspaceSelect) {
      const session = readPersistedSession();
      const needsWorkspace =
        session?.requiresWorkspaceSelection ||
        ((session?.workspaces?.length ?? 0) > 1 && !session?.activeWorkspace);
      if (needsWorkspace) {
        router.replace('/select-workspace');
        return;
      }
    }

    if (user && !publicRoute && !isOnboarding && !isWorkspaceSelect) {
      const perms = getPermissions?.() ?? [];
      if (perms.length > 0 && !pathAllowed(pathname, perms)) {
        router.replace('/overview');
      }
    }
  }, [
    user,
    ready,
    loading,
    publicRoute,
    legalRoute,
    pathname,
    isOnboarding,
    isWorkspaceSelect,
    isInvite,
    router,
    getPermissions,
  ]);

  if (legalRoute) return <>{children}</>;

  if (!ready || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  if (!user && !publicRoute) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  if (user?.mustChangePassword && !publicRoute) return <ForcePasswordChange />;

  const perms = user && !publicRoute ? (getPermissions?.() ?? []) : [];
  if (perms.length > 0 && !pathAllowed(pathname, perms)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  const showPaywall =
    user &&
    user.subscription?.status === 'expired' &&
    !publicRoute &&
    !isOnboarding;

  return (
    <>
      {children}
      {showPaywall ? <ExpiredPaywall /> : null}
    </>
  );
}
