const NON_TARGETS = [
  '/login',
  '/register',
  '/verify-email',
  '/verify-success',
  '/forgot-password',
  '/onboarding',
  '/select-workspace',
];

/** Same-origin CRM path from `?next=`; rejects external, protocol-relative and auth-flow URLs. */
export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) return null;
  const path = raw.split(/[?#]/)[0];
  if (path === '/' || NON_TARGETS.some((p) => path === p || path.startsWith(`${p}/`))) return null;
  return raw;
}
