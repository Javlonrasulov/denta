import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  BarChart3,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
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

const WIDTH_MS = 280;
const LABEL_MS = 200;
const TOOLTIP_DELAY = 180;
const WIDTH_EASING = Easing.bezier(0.22, 1, 0.36, 1);

interface SidebarProps {
  onNavigate?: () => void;
  showClose?: boolean;
  forceExpanded?: boolean;
}

type TooltipState = { label: string; top: number } | null;

export function Sidebar({ onNavigate, showClose, forceExpanded }: SidebarProps) {
  const { t } = useTranslation();
  const { colors, spacing, radius, layout, shadows, isDark } = useTheme();
  const pathname = usePathname();
  const sidebarCollapsed = useSettingsStore((s) => s.sidebarCollapsed);
  const toggleSidebarCollapsed = useSettingsStore((s) => s.toggleSidebarCollapsed);

  const collapsed = forceExpanded ? false : sidebarCollapsed;
  const expandedW = layout.sidebarWidth;
  const collapsedW = layout.sidebarCollapsedWidth;
  const targetW = collapsed ? collapsedW : expandedW;

  const widthSV = useSharedValue(forceExpanded ? expandedW : targetW);
  const labelOpacity = useSharedValue(collapsed ? 0 : 1);
  const labelMaxW = useSharedValue(collapsed ? 0 : 160);
  const sectionOpacity = useSharedValue(collapsed ? 0 : 1);
  const brandOpacity = useSharedValue(collapsed ? 0 : 1);

  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<View>(null);
  const rootPageY = useRef(0);

  useEffect(() => {
    if (forceExpanded) {
      widthSV.value = expandedW;
      labelOpacity.value = 1;
      labelMaxW.value = 160;
      sectionOpacity.value = 1;
      brandOpacity.value = 1;
      return;
    }
    widthSV.value = withTiming(targetW, { duration: WIDTH_MS, easing: WIDTH_EASING });
    labelOpacity.value = withTiming(collapsed ? 0 : 1, {
      duration: LABEL_MS,
      easing: WIDTH_EASING,
    });
    labelMaxW.value = withTiming(collapsed ? 0 : 160, {
      duration: WIDTH_MS,
      easing: WIDTH_EASING,
    });
    sectionOpacity.value = withTiming(collapsed ? 0 : 1, {
      duration: collapsed ? 120 : 220,
      easing: WIDTH_EASING,
    });
    brandOpacity.value = withTiming(collapsed ? 0 : 1, {
      duration: collapsed ? 140 : 240,
      easing: WIDTH_EASING,
    });
    setTooltip(null);
  }, [collapsed, forceExpanded, targetW, expandedW]);

  useEffect(() => {
    return () => {
      if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    };
  }, []);

  const shellStyle = useAnimatedStyle(() => ({
    width: forceExpanded ? expandedW : widthSV.value,
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
    maxWidth: labelMaxW.value,
    marginLeft: labelOpacity.value * spacing.md,
  }));

  const sectionLabelStyle = useAnimatedStyle(() => ({
    opacity: sectionOpacity.value,
    maxHeight: sectionOpacity.value * 24,
    marginBottom: sectionOpacity.value * 4,
    overflow: 'hidden' as const,
  }));

  const brandTextStyle = useAnimatedStyle(() => ({
    opacity: brandOpacity.value,
    maxWidth: brandOpacity.value * 160,
    marginLeft: brandOpacity.value * spacing.md,
    overflow: 'hidden' as const,
  }));

  const isActive = (href: string) => {
    const segment = href.split('/').pop() ?? '';
    return pathname.includes(segment);
  };

  const clearTooltip = () => {
    if (tooltipTimer.current) {
      clearTimeout(tooltipTimer.current);
      tooltipTimer.current = null;
    }
    setTooltip(null);
  };

  const measureRoot = (cb?: () => void) => {
    rootRef.current?.measureInWindow((_x, y) => {
      rootPageY.current = y;
      cb?.();
    });
  };

  const showTooltip = (label: string, itemY: number, itemH: number) => {
    if (!collapsed) return;
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    tooltipTimer.current = setTimeout(() => {
      setTooltip({ label, top: itemY + itemH / 2 - rootPageY.current });
    }, TOOLTIP_DELAY);
  };

  const renderSection = (labelKey: string, items: NavItem[]) => (
    <View key={labelKey} style={{ gap: 2 }}>
      <Animated.View style={sectionLabelStyle}>
        <Text
          variant="caption"
          color={colors.sidebarTextMuted}
          numberOfLines={1}
          style={{
            paddingHorizontal: spacing.md,
            fontSize: 11,
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}
        >
          {t(labelKey)}
        </Text>
      </Animated.View>
      {collapsed ? (
        <View
          style={{
            height: 1,
            marginHorizontal: spacing.md,
            marginVertical: 6,
            backgroundColor: colors.sidebarBorder,
            opacity: 0.65,
          }}
        />
      ) : null}
      {items.map((item) => (
        <SidebarNavItem
          key={item.key}
          item={item}
          collapsed={collapsed}
          active={item.key !== 'help' && isActive(String(item.href))}
          label={t(item.labelKey)}
          labelStyle={labelStyle}
          onNavigate={() => {
            clearTooltip();
            router.push(item.href);
            onNavigate?.();
          }}
          onHoverIn={(y, h) => {
            measureRoot(() => showTooltip(t(item.labelKey), y, h));
          }}
          onHoverOut={clearTooltip}
        />
      ))}
    </View>
  );

  return (
    <View
      ref={rootRef}
      collapsable={false}
      style={{
        height: '100%',
        zIndex: 40,
        ...(Platform.OS === 'web' ? ({ overflow: 'visible' } as object) : null),
      }}
    >
      <Animated.View
        style={[
          { height: '100%' },
          forceExpanded ? { width: '100%' as unknown as number } : shellStyle,
        ]}
      >
      <View
        style={{
          flex: 1,
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
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            paddingHorizontal: collapsed ? spacing.sm : spacing.lg,
            paddingTop: spacing.xl,
            paddingBottom: spacing.lg,
            gap: spacing.sm,
            minHeight: 76,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              flex: collapsed ? undefined : 1,
              minWidth: 0,
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
                flexShrink: 0,
              }}
            >
              <Building2 size={20} color="#FFFFFF" strokeWidth={2.2} />
            </LinearGradient>
            <Animated.View style={[{ minWidth: 0, flexShrink: 1 }, brandTextStyle]}>
              <View style={{ gap: 2 }}>
                <Text
                  variant="h2"
                  color={colors.sidebarText}
                  numberOfLines={1}
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
            </Animated.View>
          </View>

          {showClose ? (
            <Pressable
              onPress={onNavigate}
              hitSlop={12}
              accessibilityRole="button"
              style={{
                width: 32,
                height: 32,
                borderRadius: radius.full,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.sidebarIconBg,
              }}
            >
              <X size={16} color={colors.sidebarItem} />
            </Pressable>
          ) : !collapsed ? (
            <SidebarToggle
              collapsed={false}
              onPress={toggleSidebarCollapsed}
              label={t('crm.nav.collapse_sidebar')}
            />
          ) : null}
        </View>

        {!showClose && collapsed ? (
          <View style={{ alignItems: 'center', marginBottom: spacing.md }}>
            <SidebarToggle
              collapsed
              onPress={toggleSidebarCollapsed}
              label={t('crm.nav.expand_sidebar')}
              centered
            />
          </View>
        ) : null}

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: collapsed ? spacing.sm : spacing.md,
            paddingBottom: spacing.lg,
            gap: collapsed ? spacing.xs : spacing.lg,
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
          <View style={{ gap: 2 }}>
            {NAV_BOTTOM.map((item) => (
              <SidebarNavItem
                key={item.key}
                item={item}
                collapsed={collapsed}
                active={item.key !== 'help' && isActive(String(item.href))}
                label={t(item.labelKey)}
                labelStyle={labelStyle}
                onNavigate={() => {
                  clearTooltip();
                  router.push(item.href);
                  onNavigate?.();
                }}
                onHoverIn={(y, h) => {
                  measureRoot(() => showTooltip(t(item.labelKey), y, h));
                }}
                onHoverOut={clearTooltip}
              />
            ))}
          </View>
        </View>
      </View>

      {tooltip && collapsed ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: collapsedW + 10,
            top: Math.max(8, tooltip.top),
            transform: [{ translateY: -16 }],
            zIndex: 999,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: radius.md,
            backgroundColor: isDark ? colors.surfaceElevated : '#0F172A',
            borderWidth: 1,
            borderColor: isDark ? colors.border : 'rgba(255,255,255,0.1)',
            ...shadows.md,
            maxWidth: 220,
          }}
        >
          <Text
            variant="caption"
            color="#FFFFFF"
            numberOfLines={1}
            style={{ fontSize: 12.5, letterSpacing: -0.1 }}
          >
            {tooltip.label}
          </Text>
        </View>
      ) : null}
      </Animated.View>
    </View>
  );
}

function SidebarNavItem({
  item,
  collapsed,
  active,
  label,
  labelStyle,
  onNavigate,
  onHoverIn,
  onHoverOut,
}: {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
  label: string;
  labelStyle: object;
  onNavigate: () => void;
  onHoverIn: (y: number, h: number) => void;
  onHoverOut: () => void;
}) {
  const { colors, spacing, radius, iconSizes } = useTheme();
  const Icon = item.icon;
  const itemRef = useRef<View>(null);

  return (
    <View ref={itemRef} collapsable={false}>
      <Pressable
        onPress={onNavigate}
        onHoverIn={() => {
          if (!collapsed) return;
          itemRef.current?.measureInWindow((_x, y, _w, h) => onHoverIn(y, h));
        }}
        onHoverOut={onHoverOut}
        onPressOut={onHoverOut}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        accessibilityLabel={label}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          paddingVertical: 8,
          paddingHorizontal: collapsed ? 0 : spacing.sm,
          paddingLeft: collapsed ? 0 : spacing.md,
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
            width: 36,
            height: 36,
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
        <Animated.View
          pointerEvents={collapsed ? 'none' : 'auto'}
          style={[{ minWidth: 0, flexShrink: 1 }, labelStyle]}
        >
          <Text
            variant="label"
            color={active ? colors.sidebarText : colors.sidebarItem}
            numberOfLines={1}
            style={{ fontSize: 14, letterSpacing: -0.1 }}
          >
            {label}
          </Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}

function SidebarToggle({
  collapsed,
  onPress,
  label,
  centered,
}: {
  collapsed: boolean;
  onPress: () => void;
  label: string;
  centered?: boolean;
}) {
  const { colors, radius, iconSizes } = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[{ alignSelf: centered ? 'center' : 'auto', flexShrink: 0 }, animStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.9, { damping: 16, stiffness: 340 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 16, stiffness: 340 });
        }}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => ({
          width: 34,
          height: 34,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: pressed ? 'rgba(255,255,255,0.16)' : colors.sidebarIconBg,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.12)',
        })}
      >
        {collapsed ? (
          <ChevronRight size={iconSizes.sm} color={colors.sidebarItem} strokeWidth={2.2} />
        ) : (
          <ChevronLeft size={iconSizes.sm} color={colors.sidebarItem} strokeWidth={2.2} />
        )}
      </Pressable>
    </Animated.View>
  );
}
