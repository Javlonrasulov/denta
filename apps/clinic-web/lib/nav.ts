import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  CalendarDays,
  CircleHelp,
  DoorOpen,
  LayoutDashboard,
  Package,
  Settings,
  Stethoscope,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react';

export type ClinicNavKey =
  | 'overview'
  | 'appointments'
  | 'patients'
  | 'doctors'
  | 'rooms'
  | 'services'
  | 'finance'
  | 'inventory'
  | 'reports'
  | 'settings'
  | 'help';

export type NavItem = {
  key: ClinicNavKey;
  href: string;
  labelKey: string;
  icon: LucideIcon;
  /** If set, user needs ANY of these permissions to see the item */
  permissions?: string[];
};

export const NAV_MAIN: NavItem[] = [
  { key: 'overview', href: '/overview', labelKey: 'crm.nav.overview', icon: LayoutDashboard },
  {
    key: 'appointments',
    href: '/appointments',
    labelKey: 'crm.nav.appointments',
    icon: CalendarDays,
    permissions: ['appointment:create', 'appointment:update'],
  },
  {
    key: 'patients',
    href: '/patients',
    labelKey: 'crm.nav.patients',
    icon: Users,
    permissions: ['patient:read'],
  },
];

export const NAV_CLINIC: NavItem[] = [
  {
    key: 'doctors',
    href: '/doctors',
    labelKey: 'crm.nav.doctors',
    icon: Stethoscope,
    permissions: ['doctor:manage', 'clinic:read'],
  },
  {
    key: 'rooms',
    href: '/rooms',
    labelKey: 'crm.nav.rooms',
    icon: DoorOpen,
    permissions: ['clinic:read'],
  },
  {
    key: 'services',
    href: '/services',
    labelKey: 'crm.nav.services',
    icon: Wrench,
    permissions: ['clinic:read'],
  },
];

export const NAV_OPS: NavItem[] = [
  {
    key: 'finance',
    href: '/finance',
    labelKey: 'crm.nav.finance',
    icon: Wallet,
    permissions: ['finance:read'],
  },
  {
    key: 'inventory',
    href: '/inventory',
    labelKey: 'crm.nav.inventory',
    icon: Package,
    permissions: ['inventory:manage'],
  },
  {
    key: 'reports',
    href: '/reports',
    labelKey: 'crm.nav.reports',
    icon: BarChart3,
    permissions: ['reports:read'],
  },
];

export const NAV_BOTTOM: NavItem[] = [
  {
    key: 'settings',
    href: '/settings',
    labelKey: 'crm.nav.settings',
    icon: Settings,
    permissions: ['settings:manage', 'members:manage', 'clinic:read'],
  },
  { key: 'help', href: '/settings', labelKey: 'crm.nav.help', icon: CircleHelp },
];

export function filterNavByPermissions(
  items: NavItem[],
  permissions: string[],
): NavItem[] {
  if (permissions.includes('*')) return items;
  return items.filter((item) => {
    if (!item.permissions?.length) return true;
    return item.permissions.some((p) => permissions.includes(p));
  });
}

export const ALL_NAV_ITEMS: NavItem[] = [
  ...NAV_MAIN,
  ...NAV_CLINIC,
  ...NAV_OPS,
  ...NAV_BOTTOM.filter((i) => i.key !== 'help'),
];
