import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BarChart3,
  Building2,
  CalendarDays,
  CircleHelp,
  LayoutDashboard,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
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
import { useSettingsStore } from '@/store/settingsStore';
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

type NavItem = { key: ClinicNavKey; href: Href; icon: LucideIcon; labelKey: string };

const NAV_MAIN: NavItem[] = [
  { key: 'overview', href: '/(clinic)/(shell)/overview', icon: LayoutDashboard, labelKey: 'crm.nav.overview' },
  { key: 'appointments', href: '/(clinic)/(shell)/appointments', icon: CalendarDays, labelKey: 'crm.nav.appointments' },
  { key: 'patients', href: '/(clinic)/(shell)/patients', icon: Users, labelKey: 'crm.nav.patients' },
];

const NAV_CLINIC: NavItem[] = [
  { key: 'doctors', href: '/(clinic)/(shell)/doctors', icon: Stethoscope, labelKey: 'crm.nav.doctors' },
  { key: 'rooms', href: '/(clinic)/(shell)/rooms', icon: DoorOpen, labelKey: 'crm.nav.rooms' },
  { key: 'services', href: '/(clinic)/(shell)/services', icon: Wrench, labelKey: 'crm.nav.services' },
];

const NAV_OPS: NavItem[] = [
  { key: 'finance', href: '/(clinic)/(shell)/finance', icon: Wallet, labelKey: 'crm.nav.finance' },
  { key: 'inventory', href: '/(clinic)/(shell)/inventory', icon: Package, labelKey: 'crm.nav.inventory' },
  { key: 'reports', href: '/(clinic)/(shell)/reports', icon: BarChart3, labelKey: 'crm.nav.reports' },
];

const NAV_BOTTOM: NavItem[] = [
  { key: 'settings', href: '/(clinic)/(shell)/settings', icon: Settings, labelKey: 'crm.nav.settings' },
  { key: 'help', href: '/(clinic)/(shell)/settings', icon: CircleHelp, labelKey: 'crm.nav.help' },
];

interface SidebarProps {
  onNavigate?: () => void;
  showClose?: boolean;
  /** Force expanded (e.g. mobile drawer). Defaults to store value. */
  forceExpanded?: boolean;
}

export function Sidebar({ onNavigate, showClose, forceExpanded }: SidebarProps) {
  const { t } = useTranslation();
  const { colors, spacing, radius, layout, iconSizes } = useTheme();
  const pathname = usePathname();
  const sidebarCollapsed = useSettingsStore((s) => s.sidebarCollapsed);
  const toggleSidebarCollapsed = useSettingsStore((s) => s.toggleSidebarCollapsed);

  const collapsed = forceExpanded ? false : sidebarCollapsed;
  const width = forceExpanded
    ? '100%'
    : collapsed
      ? layout.sidebarCollapsedWidth
      : layout.sidebarWidth;

  const isActive = (href: string) => {
    const segment = href.split('/').pop() ?? '';
    return pathname.includes(segment);
  };

  const renderItem = (item: NavItem) => {
    const Icon = item.icon;
    const active = item.key !== 'help' && isActive(String(item.href));
    const label = t(item.labelKey);

    return (
      <Pressable
        key={item.key}
        onPress={() => {
          router.push(item.href);
          onNavigate?.();
        }}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        accessibilityLabel={label}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: collapsed ? 0 : spacing.md,
          paddingVertical: collapsed ? 10 : 9,
          paddingHorizontal: collapsed ? spacing.sm : spacing.sm,
          paddingLeft: collapsed ? spacing.sm : spacing.md,
          borderRadius: radius.lg,
          backgroundColor: active
            ? colors.sidebarActiveBg
            : pressed
              ? colors.sidebarIconBg
              : 'transparent',
          minHeight: 44,
          overflow: 'hidden',
        })}
      >
        {active && !collapsed ? (
          <View
            style={{
              position: 'absolute',
              left: 0,
              top: 8,
              bottom: 8,
              width: 3,
              borderRadius: 2,
              backgroundColor: colors.sidebarActiveAccent,
            }}
          />
        ) : null}
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: radius.md,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: active ? 'rgba(45, 212, 191, 0.28)' : colors.sidebarIconBg,
          }}
        >
          <Icon
            size={iconSizes.sm}
            color={active ? colors.sidebarActiveAccent : colors.sidebarItem}
            strokeWidth={active ? 2.25 : 1.9}
          />
        </View>
        {!collapsed ? (
          <Text
            variant="label"
            color={active ? colors.sidebarText : colors.sidebarItem}
            numberOfLines={1}
            style={{ fontSize: 14, letterSpacing: -0.1, flex: 1, minWidth: 0 }}
          >
            {label}
          </Text>
        ) : null}
      </Pressable>
    );
  };

  const renderSection = (labelKey: string, items: NavItem[]) => (
    <View key={labelKey} style={{ gap: 4 }}>
      {collapsed ? (
        <View
          style={{
            height: 1,
            marginHorizontal: spacing.sm,
            marginVertical: spacing.xs,
            backgroundColor: colors.sidebarBorder,
          }}
        />
      ) : (
        <Text
          variant="caption"
          color={colors.sidebarTextMuted}
          style={{
            paddingHorizontal: spacing.md,
            paddingBottom: 4,
            fontSize: 11,
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}
        >
          {t(labelKey)}
        </Text>
      )}
      {items.map(renderItem)}
    </View>
  );

  return (
    <View
      style={{
        width,
        height: '100%',
        backgroundColor: colors.sidebar,
        borderRightWidth: 1,
        borderRightColor: colors.sidebarBorder,
        overflow: 'hidden',
      }}
    >
      <LinearGradient
        colors={[
          'rgba(15, 155, 142, 0.18)',
          'rgba(15, 155, 142, 0.1)',
          'rgba(15, 155, 142, 0.04)',
          'rgba(10, 37, 64, 0)',
        ]}
        locations={[0, 0.35, 0.7, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 320 }}
        pointerEvents="none"
      />

      <View
        style={{
          flexDirection: collapsed ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          paddingHorizontal: collapsed ? spacing.sm : spacing.lg,
          paddingTop: spacing.xl,
          paddingBottom: spacing.lg,
          gap: spacing.sm,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            flex: collapsed ? undefined : 1,
          }}
        >
          <LinearGradient
            colors={[colors.sidebarBrandFrom, colors.sidebarBrandTo]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 40,
              height: 40,
              borderRadius: radius.md,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Building2 size={20} color="#FFFFFF" strokeWidth={2.2} />
          </LinearGradient>
          {!collapsed ? (
            <View style={{ flex: 1, gap: 2 }}>
              <Text
                variant="h2"
                color={colors.sidebarText}
                style={{ fontSize: 17, letterSpacing: -0.4, lineHeight: 22 }}
              >
                {t('common.app_name')}
              </Text>
              <Text
                variant="caption"
                color={colors.sidebarTextMuted}
                numberOfLines={1}
                style={{ fontSize: 11.5, letterSpacing: 0.15 }}
              >
                Smile Dental Clinic
              </Text>
            </View>
          ) : null}
        </View>

        {showClose ? (
          <Pressable
            onPress={onNavigate}
            hitSlop={12}
            style={{
              width: 32,
              height: 32,
              borderRadius: radius.sm,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.sidebarIconBg,
            }}
          >
            <X size={16} color={colors.sidebarItem} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: collapsed ? spacing.sm : spacing.md,
          paddingBottom: spacing.lg,
          gap: collapsed ? spacing.sm : spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {renderSection('crm.nav.section_main', NAV_MAIN)}
        {renderSection('crm.nav.section_clinic', NAV_CLINIC)}
        {renderSection('crm.nav.section_ops', NAV_OPS)}
      </ScrollView>

      <View
        style={{
          paddingHorizontal: collapsed ? spacing.sm : spacing.md,
          paddingBottom: spacing.lg,
          gap: spacing.md,
          borderTopWidth: 1,
          borderTopColor: colors.sidebarBorder,
          paddingTop: spacing.md,
        }}
      >
        <View style={{ gap: 2 }}>{NAV_BOTTOM.map(renderItem)}</View>

        {!showClose ? (
          <Pressable
            onPress={toggleSidebarCollapsed}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={
              collapsed ? t('crm.nav.expand_sidebar') : t('crm.nav.collapse_sidebar')
            }
            style={({ pressed }) => ({
              alignSelf: 'center',
              width: 34,
              height: 34,
              borderRadius: radius.md,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: pressed ? 'rgba(255,255,255,0.12)' : colors.sidebarIconBg,
            })}
          >
            {collapsed ? (
              <PanelLeftOpen size={iconSizes.sm} color={colors.sidebarItem} />
            ) : (
              <PanelLeftClose size={iconSizes.sm} color={colors.sidebarItem} />
            )}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
