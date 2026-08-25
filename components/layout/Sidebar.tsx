import React from 'react';
import { Pressable, View } from 'react-native';
import {
  BarChart3,
  CalendarDays,
  CircleHelp,
  LayoutDashboard,
  Package,
  Settings,
  Stethoscope,
  DoorOpen,
  Users,
  Wallet,
  Wrench,
  X,
} from '@/components/icons';
import type { LucideIcon } from '@/components/icons';
import { useTranslation } from 'react-i18next';
import { Href, router, usePathname } from 'expo-router';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';

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

const NAV_MAIN: { key: ClinicNavKey; href: Href; icon: LucideIcon; labelKey: string }[] = [
  { key: 'overview', href: '/(clinic)/(shell)/overview', icon: LayoutDashboard, labelKey: 'crm.nav.overview' },
  { key: 'appointments', href: '/(clinic)/(shell)/appointments', icon: CalendarDays, labelKey: 'crm.nav.appointments' },
  { key: 'patients', href: '/(clinic)/(shell)/patients', icon: Users, labelKey: 'crm.nav.patients' },
  { key: 'doctors', href: '/(clinic)/(shell)/doctors', icon: Stethoscope, labelKey: 'crm.nav.doctors' },
  { key: 'rooms', href: '/(clinic)/(shell)/rooms', icon: DoorOpen, labelKey: 'crm.nav.rooms' },
  { key: 'services', href: '/(clinic)/(shell)/services', icon: Wrench, labelKey: 'crm.nav.services' },
  { key: 'finance', href: '/(clinic)/(shell)/finance', icon: Wallet, labelKey: 'crm.nav.finance' },
  { key: 'inventory', href: '/(clinic)/(shell)/inventory', icon: Package, labelKey: 'crm.nav.inventory' },
  { key: 'reports', href: '/(clinic)/(shell)/reports', icon: BarChart3, labelKey: 'crm.nav.reports' },
];

const NAV_BOTTOM: { key: ClinicNavKey; href: Href; icon: LucideIcon; labelKey: string }[] = [
  { key: 'settings', href: '/(clinic)/(shell)/settings', icon: Settings, labelKey: 'crm.nav.settings' },
  { key: 'help', href: '/(clinic)/(shell)/settings', icon: CircleHelp, labelKey: 'crm.nav.help' },
];

interface SidebarProps {
  onNavigate?: () => void;
  showClose?: boolean;
}

export function Sidebar({ onNavigate, showClose }: SidebarProps) {
  const { t } = useTranslation();
  const { colors, spacing, radius, layout, iconSizes } = useTheme();
  const pathname = usePathname();

  const isActive = (href: string) => {
    const segment = href.split('/').pop() ?? '';
    return pathname.includes(segment);
  };

  const renderItem = (item: (typeof NAV_MAIN)[0]) => {
    const Icon = item.icon;
    const active = isActive(String(item.href));
    return (
      <Pressable
        key={item.key}
        onPress={() => {
          router.push(item.href);
          onNavigate?.();
        }}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          paddingVertical: 10,
          paddingHorizontal: spacing.md,
          borderRadius: radius.md,
          backgroundColor: active
            ? colors.navActive
            : pressed
              ? colors.surfaceSoft
              : 'transparent',
          minHeight: 44,
          borderWidth: active ? 1 : 0,
          borderColor: active ? colors.border : 'transparent',
        })}
      >
        <Icon
          size={iconSizes.sm}
          color={active ? colors.navActiveText : colors.textMuted}
          strokeWidth={active ? 2.25 : 1.75}
        />
        <Text
          variant="label"
          color={active ? colors.navActiveText : colors.textSecondary}
          style={{ fontSize: 13, letterSpacing: -0.1 }}
        >
          {t(item.labelKey)}
        </Text>
      </Pressable>
    );
  };

  return (
    <View
      style={{
        width: layout.sidebarWidth,
        backgroundColor: colors.sidebar,
        borderRightWidth: 1,
        borderRightColor: colors.sidebarBorder,
        paddingTop: spacing.xl,
        paddingBottom: spacing.lg,
        paddingHorizontal: spacing.md,
        height: '100%',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.sm,
          marginBottom: spacing['2xl'],
        }}
      >
        <View style={{ gap: 4 }}>
          <Text
            variant="h2"
            color={colors.primary}
            style={{ fontSize: 20, letterSpacing: -0.6 }}
          >
            {t('common.app_name')}
          </Text>
          <Text variant="caption" color={colors.textMuted} style={{ letterSpacing: 0.2 }}>
            Smile Dental Clinic
          </Text>
        </View>
        {showClose ? (
          <Pressable onPress={onNavigate} hitSlop={12} style={{ padding: 4 }}>
            <X size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <View style={{ flex: 1, gap: 2 }}>{NAV_MAIN.map(renderItem)}</View>

      <View style={{ gap: 2, borderTopWidth: 1, borderTopColor: colors.borderSubtle, paddingTop: spacing.md }}>
        {NAV_BOTTOM.map(renderItem)}
      </View>
    </View>
  );
}
