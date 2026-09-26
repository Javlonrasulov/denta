'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { useAuth } from '@/components/providers/AuthProvider';
import { ExpiredPaywall } from '@/components/auth/ExpiredPaywall';
import { ALL_NAV_ITEMS } from '@/lib/nav';

const PUBLIC_PREFIXES = [
  '/login',
  '/register',
  '/verify-email',
  '/verify-success',
  '/forgot-password',
  '/invite',
];

function isPublic(path: string): boolean {
  return PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
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
  const isOnboarding = pathname === '/onboarding' || pathname.startsWith('/onboarding/');
  const isWorkspaceSelect =
    pathname === '/select-workspace' || pathname.startsWith('/select-workspace/');

  useEffect(() => {
    if (!ready || loading) return;

    if (!user && !publicRoute) {
      router.replace('/login');
      return;
    }

    if (user && publicRoute && pathname !== '/verify-success') {
      if (!user.emailVerifiedAt) {
        if (pathname !== '/verify-email') {
          router.replace(`/verify-email?email=${encodeURIComponent(user.email)}`);
        }
        return;
      }
      if (!user.onboardingCompleted && pathname !== '/onboarding') {
        router.replace('/onboarding');
        return;
      }
      router.replace('/overview');
      return;
    }

    if (user && !user.emailVerifiedAt && !publicRoute) {
      router.replace(`/verify-email?email=${encodeURIComponent(user.email)}`);
      return;
    }

    if (
      user &&
      user.emailVerifiedAt &&
      !user.onboardingCompleted &&
      !isOnboarding &&
      !isWorkspaceSelect &&
      !publicRoute
    ) {
      router.replace('/onboarding');
      return;
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
    pathname,
    isOnboarding,
    isWorkspaceSelect,
    router,
    getPermissions,
  ]);

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

  const showPaywall =
    user &&
    user.subscription.status === 'expired' &&
    !publicRoute &&
    !isOnboarding;

  return (
    <>
      {children}
      {showPaywall ? <ExpiredPaywall /> : null}
    </>
  );
}
