import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  CalendarDays,
  Crown,
  DoorOpen,
  FileSignature,
  HandCoins,
  Package,
  ShieldAlert,
  Settings,
  Stethoscope,
  UserCog,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react';

export type AccessLevel = 'none' | 'view' | 'manage';

export type PageAccessDef = {
  key: string;
  labelKey: string;
  icon: LucideIcon;
  view?: string[];
  manage?: string[];
};

/** Must stay in sync with the permission guards in apps/api and the sidebar in lib/nav.ts */
export const PAGE_ACCESS: PageAccessDef[] = [
  {
    key: 'appointments',
    labelKey: 'crm.nav.appointments',
    icon: CalendarDays,
    view: ['appointment:read'],
    manage: ['appointment:create', 'appointment:update'],
  },
  {
    key: 'patients',
    labelKey: 'crm.nav.patients',
    icon: Users,
    view: ['patient:read'],
    manage: ['patient:write', 'patient:update'],
  },
  {
    key: 'doctors',
    labelKey: 'crm.nav.doctors',
    icon: Stethoscope,
    view: ['doctor:read'],
    manage: ['doctor:manage'],
  },
  {
    key: 'rooms',
    labelKey: 'crm.nav.rooms',
    icon: DoorOpen,
    view: ['room:read'],
    manage: ['room:manage'],
  },
  {
    key: 'services',
    labelKey: 'crm.nav.services',
    icon: Wrench,
    view: ['service:read'],
    manage: ['service:manage'],
  },
  {
    key: 'finance',
    labelKey: 'crm.nav.finance',
    icon: Wallet,
    view: ['finance:read'],
    manage: ['finance:write'],
  },
  {
    key: 'doctor_rent',
    labelKey: 'crm.doctor_finance.access.rent',
    icon: HandCoins,
    view: ['doctor_finance:read'],
    manage: ['doctor_finance:payment'],
  },
  {
    key: 'doctor_rent_admin',
    labelKey: 'crm.doctor_finance.access.rent_admin',
    icon: ShieldAlert,
    manage: ['doctor_finance:manage'],
  },
  {
    key: 'doctor_agreements',
    labelKey: 'crm.doctor_finance.access.agreements',
    icon: FileSignature,
    manage: ['doctor_finance:agreement'],
  },
  {
    key: 'inventory',
    labelKey: 'crm.nav.inventory',
    icon: Package,
    view: ['inventory:read'],
    manage: ['inventory:manage'],
  },
  { key: 'reports', labelKey: 'crm.nav.reports', icon: BarChart3, view: ['reports:read'] },
  { key: 'users', labelKey: 'crm.nav.users', icon: UserCog, manage: ['members:manage'] },
  {
    key: 'settings',
    labelKey: 'crm.nav.settings',
    icon: Settings,
    view: ['settings:read'],
    manage: ['settings:manage'],
  },
];

export type AccessMap = Record<string, AccessLevel>;

export function levelsFor(page: PageAccessDef): AccessLevel[] {
  return [
    'none',
    ...(page.view ? (['view'] as const) : []),
    ...(page.manage ? (['manage'] as const) : []),
  ];
}

export function emptyAccess(): AccessMap {
  return Object.fromEntries(PAGE_ACCESS.map((p) => [p.key, 'none' as AccessLevel]));
}

export function accessFromPermissions(permissions: string[]): AccessMap {
  const has = new Set(permissions);
  const all = (list?: string[]) => Boolean(list?.length) && list!.every((p) => has.has(p));
  return Object.fromEntries(
    PAGE_ACCESS.map((p) => {
      const level: AccessLevel = all(p.manage) ? 'manage' : all(p.view) ? 'view' : 'none';
      return [p.key, level];
    }),
  );
}

/** Explicit ALLOW/DENY for every page permission, so the result does not depend on role defaults. */
export function permissionOverrides(
  access: AccessMap,
): { permission: string; effect: 'ALLOW' | 'DENY' }[] {
  const out: { permission: string; effect: 'ALLOW' | 'DENY' }[] = [];
  for (const page of PAGE_ACCESS) {
    const level = access[page.key] ?? 'none';
    const viewOn = level === 'view' || level === 'manage';
    const manageOn = level === 'manage';
    for (const p of page.view ?? []) out.push({ permission: p, effect: viewOn ? 'ALLOW' : 'DENY' });
    for (const p of page.manage ?? []) {
      out.push({ permission: p, effect: manageOn ? 'ALLOW' : 'DENY' });
    }
  }
  return out;
}

const MEMBER_ERROR_CODES = new Set([
  'ALREADY_MEMBER',
  'PERMISSION_NOT_GRANTABLE',
  'INVALID_PERMISSION',
  'SELF_MODIFY',
  'MAIL_SEND_FAILED',
  'INVALID_PHONE',
  'INVALID_EMAIL',
  'FORBIDDEN',
]);

/** i18n key for a members API error, or null when the server message should be shown as is. */
export function memberErrorKey(err: unknown): string | null {
  const code = (err as { code?: string } | null)?.code;
  return code && MEMBER_ERROR_CODES.has(code) ? `crm.users.errors.${code}` : null;
}

export const ROLE_BADGES: Record<string, { icon: LucideIcon; tone: string }> = {
  CLINIC_OWNER: { icon: Crown, tone: 'bg-amber-50 text-amber-700 ring-amber-600/15' },
  DOCTOR: { icon: Stethoscope, tone: 'bg-cyan-50 text-cyan-700 ring-cyan-600/15' },
};
