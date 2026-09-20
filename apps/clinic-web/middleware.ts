import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE = 'denta.clinic.session';

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/verify-email',
  '/verify-success',
  '/forgot-password',
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isStatic(pathname: string): boolean {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isStatic(pathname)) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const authed = Boolean(token);

  if (!authed && !isPublic(pathname) && pathname !== '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (authed && (pathname === '/login' || pathname === '/register')) {
    const url = request.nextUrl.clone();
    url.pathname = '/overview';
    return NextResponse.redirect(url);
  }

  if (pathname === '/' ) {
    const url = request.nextUrl.clone();
    url.pathname = authed ? '/overview' : '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
