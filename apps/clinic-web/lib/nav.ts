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
};

export const NAV_MAIN: NavItem[] = [
  { key: 'overview', href: '/overview', labelKey: 'crm.nav.overview', icon: LayoutDashboard },
  {
    key: 'appointments',
    href: '/appointments',
    labelKey: 'crm.nav.appointments',
    icon: CalendarDays,
  },
  { key: 'patients', href: '/patients', labelKey: 'crm.nav.patients', icon: Users },
];

export const NAV_CLINIC: NavItem[] = [
  { key: 'doctors', href: '/doctors', labelKey: 'crm.nav.doctors', icon: Stethoscope },
  { key: 'rooms', href: '/rooms', labelKey: 'crm.nav.rooms', icon: DoorOpen },
  { key: 'services', href: '/services', labelKey: 'crm.nav.services', icon: Wrench },
];

export const NAV_OPS: NavItem[] = [
  { key: 'finance', href: '/finance', labelKey: 'crm.nav.finance', icon: Wallet },
  { key: 'inventory', href: '/inventory', labelKey: 'crm.nav.inventory', icon: Package },
  { key: 'reports', href: '/reports', labelKey: 'crm.nav.reports', icon: BarChart3 },
];

export const NAV_BOTTOM: NavItem[] = [
  { key: 'settings', href: '/settings', labelKey: 'crm.nav.settings', icon: Settings },
  { key: 'help', href: '/settings', labelKey: 'crm.nav.help', icon: CircleHelp },
];
