import React, { useRef, useState } from 'react';
import { Modal, Pressable, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  Check,
  ChevronDown,
  Globe,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
  UserRound,
} from '@/components/icons';

import { Avatar } from '@/components/ui/Avatar';
import {
  LANGUAGE_MENU_WIDTH,
  LanguageMenuItems,
  languageMenuCardStyle,
  LOCALE_OPTIONS,
} from '@/components/ui/LanguageMenu';
import { Text } from '@/components/ui/Text';
import { CredentialsModal } from '@/components/layout/CredentialsModal';
import { FontSizeControl } from '@/components/layout/FontSizeControl';
import { GlobalSearchModal } from '@/components/layout/GlobalSearchModal';
import {
  getInitialUnreadCount,
  NotificationsPanel,
} from '@/components/layout/NotificationsPanel';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/theme';

const ACCOUNT_MENU_WIDTH = 268;

interface TopHeaderProps {
  title: string;
  subtitle?: string;
  onMenuPress?: () => void;
  showMenu?: boolean;
}

export function TopHeader({ title, subtitle, onMenuPress, showMenu }: TopHeaderProps) {
  const { t } = useTranslation();
  const { colors, spacing, radius, layout, isDark, shadows, isDesktop } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const locale = useSettingsStore((s) => s.locale);
  const setLocale = useSettingsStore((s) => s.setLocale);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const adminName = useSettingsStore((s) => s.adminName);
  const logout = useSettingsStore((s) => s.logout);

  const [langOpen, setLangOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(getInitialUnreadCount);
  const [langPos, setLangPos] = useState({ top: 56, left: 8 });
  const [accountPos, setAccountPos] = useState({ top: 56, right: 8 });
  const [notifAnchor, setNotifAnchor] = useState({ top: 56, right: 24 });

  const langBtnRef = useRef<View>(null);
  const accountBtnRef = useRef<View>(null);
  const notifBtnRef = useRef<View>(null);

  const currentLocale = LOCALE_OPTIONS.find((item) => item.code === locale) ?? LOCALE_OPTIONS[0];
  const compact = !isDesktop;

  const openLanguageMenu = () => {
    langBtnRef.current?.measureInWindow((x, y, width, height) => {
      const centered = x + width / 2 - LANGUAGE_MENU_WIDTH / 2;
      const left = Math.min(Math.max(8, centered), windowWidth - LANGUAGE_MENU_WIDTH - 8);
      setLangPos({ top: y + height + 8, left });
      setLangOpen(true);
    });
  };

  const openLanguageFromAccount = () => {
    setAccountOpen(false);
    setLangPos({
      top: accountPos.top,
      left: Math.max(8, windowWidth - accountPos.right - LANGUAGE_MENU_WIDTH),
    });
    setLangOpen(true);
  };

  const openAccountMenu = () => {
    accountBtnRef.current?.measureInWindow((x, y, width, height) => {
      setAccountPos({
        top: y + height + 8,
        right: Math.max(8, windowWidth - x - width),
      });
      setAccountOpen(true);
    });
  };

  const openNotifications = () => {
    notifBtnRef.current?.measureInWindow((x, y, width, height) => {
      setNotifAnchor({
        top: y + height + 8,
        right: Math.max(8, windowWidth - x - width),
      });
      setNotifOpen(true);
    });
  };

  const handleLogout = () => {
    setAccountOpen(false);
    logout();
    router.replace('/login');
  };

  return (
    <View
      style={{
        height: compact ? 56 : layout.headerHeight,
        paddingHorizontal: compact ? spacing.md : spacing.xl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.md,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderSubtle,
        zIndex: 20,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: compact ? spacing.sm : spacing.md,
          flex: 1,
          minWidth: 0,
        }}
      >
        {showMenu ? (
          <GhostIconButton accessibilityLabel="Menu" onPress={onMenuPress} size={40}>
            <Menu size={22} color={colors.text} strokeWidth={1.75} />
          </GhostIconButton>
        ) : null}

        <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
          <Text
            variant="h3"
            numberOfLines={1}
            style={{ fontSize: compact ? 16 : 17, letterSpacing: -0.3 }}
          >
            {title}
          </Text>
          {subtitle && !compact ? (
            <Text variant="caption" muted numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: compact ? 2 : 4,
          flexShrink: 0,
        }}
      >
        {!compact ? (
          <View ref={langBtnRef} collapsable={false}>
            <Pressable
              onPress={openLanguageMenu}
              accessibilityRole="button"
              accessibilityLabel={t('profile.language')}
              style={({ pressed }) => ({
                height: 34,
                paddingHorizontal: 10,
                borderRadius: radius.md,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: pressed ? colors.surfaceSoft : 'transparent',
              })}
            >
              <Globe size={15} color={colors.textMuted} strokeWidth={1.8} />
              <Text variant="caption" weight="semibold" color={colors.textSecondary}>
                {currentLocale.short}
              </Text>
              <ChevronDown size={14} color={colors.textMuted} />
            </Pressable>
          </View>
        ) : null}

        {!compact ? (
          <GhostIconButton
            accessibilityLabel={t('profile.dark_mode')}
            onPress={() => setThemeMode(isDark ? 'light' : 'dark')}
          >
            {isDark ? (
              <Sun size={18} color={colors.textSecondary} strokeWidth={1.8} />
            ) : (
              <Moon size={18} color={colors.textSecondary} strokeWidth={1.8} />
            )}
          </GhostIconButton>
        ) : null}

        {isDesktop ? <FontSizeControl /> : null}

        <GhostIconButton
          accessibilityLabel={t('common.search')}
          onPress={() => setSearchOpen(true)}
        >
          <Search size={18} color={colors.textSecondary} strokeWidth={1.8} />
        </GhostIconButton>

        <View ref={notifBtnRef} collapsable={false} style={{ position: 'relative' }}>
          <GhostIconButton
            accessibilityLabel={t('profile.notifications')}
            onPress={openNotifications}
          >
            <Bell size={18} color={colors.textSecondary} strokeWidth={1.8} />
          </GhostIconButton>
          {unreadCount > 0 ? (
            <View
              style={{
                position: 'absolute',
                top: 9,
                right: 9,
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: colors.error,
              }}
            />
          ) : null}
        </View>

        <View
          style={{
            width: 1,
            height: 20,
            backgroundColor: colors.borderSubtle,
            marginHorizontal: compact ? 4 : 8,
          }}
        />

        <View ref={accountBtnRef} collapsable={false}>
          <Pressable
            onPress={compact ? openAccountMenu : () => setCredentialsOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={adminName}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              height: 34,
              paddingLeft: 2,
              paddingRight: compact ? 2 : 8,
              borderRadius: radius.full,
              backgroundColor: pressed ? colors.surfaceSoft : 'transparent',
            })}
          >
            <Avatar name={adminName} size={28} />
            {!compact ? (
              <Text variant="caption" weight="semibold" numberOfLines={1}>
                {adminName}
              </Text>
            ) : null}
          </Pressable>
        </View>

        {!compact ? (
          <Pressable
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel={t('profile.logout')}
            style={({ pressed }) => ({
              height: 34,
              paddingHorizontal: 12,
              borderRadius: radius.md,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              backgroundColor: pressed ? colors.errorMuted : 'transparent',
            })}
          >
            <LogOut size={14} color={colors.textSecondary} strokeWidth={1.8} />
            <Text variant="caption" weight="semibold" color={colors.textSecondary}>
              {t('profile.logout')}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <CredentialsModal visible={credentialsOpen} onClose={() => setCredentialsOpen(false)} />
      <GlobalSearchModal visible={searchOpen} onClose={() => setSearchOpen(false)} />
      <NotificationsPanel
        visible={notifOpen}
        onClose={() => setNotifOpen(false)}
        anchor={notifAnchor}
        onUnreadChange={setUnreadCount}
      />

      <DropdownModal visible={langOpen} onClose={() => setLangOpen(false)}>
        <View
          style={{
            position: 'absolute',
            top: langPos.top,
            left: langPos.left,
            ...languageMenuCardStyle(colors, shadows),
          }}
        >
          <LanguageMenuItems
            locale={locale}
            onSelect={(code) => {
              setLocale(code);
              setLangOpen(false);
            }}
          />
        </View>
      </DropdownModal>

      <DropdownModal visible={accountOpen && compact} onClose={() => setAccountOpen(false)}>
        <View
          style={{
            position: 'absolute',
            top: accountPos.top,
            right: accountPos.right,
            width: Math.min(ACCOUNT_MENU_WIDTH, windowWidth - 16),
            backgroundColor: colors.surfaceElevated,
            borderRadius: radius.xl,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            paddingVertical: spacing.sm,
            ...shadows.lg,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              paddingHorizontal: spacing.lg,
              paddingBottom: spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: colors.borderSubtle,
            }}
          >
            <Avatar name={adminName} size={40} />
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <Text variant="label" numberOfLines={1}>
                {adminName}
              </Text>
              <Text variant="caption" muted numberOfLines={1}>
                {t('common.app_name')}
              </Text>
            </View>
          </View>

          <View style={{ padding: spacing.xs, gap: 2 }}>
            <MenuRow
              onPress={() => {
                setAccountOpen(false);
                setCredentialsOpen(true);
              }}
              left={<UserRound size={16} color={colors.textSecondary} />}
              title={t('auth.credentials_title')}
            />
            <MenuRow
              onPress={openLanguageFromAccount}
              left={<Globe size={16} color={colors.textSecondary} />}
              title={t('profile.language')}
              trailing={
                <Text variant="caption" muted>
                  {currentLocale.short}
                </Text>
              }
            />
            <MenuRow
              onPress={() => setThemeMode(isDark ? 'light' : 'dark')}
              left={
                isDark ? (
                  <Sun size={16} color={colors.textSecondary} />
                ) : (
                  <Moon size={16} color={colors.textSecondary} />
                )
              }
              title={t('profile.dark_mode')}
              trailing={
                <Text variant="caption" muted>
                  {isDark ? t('common.yes') : t('common.no')}
                </Text>
              }
            />
          </View>

          <View
            style={{
              marginTop: spacing.xs,
              borderTopWidth: 1,
              borderTopColor: colors.borderSubtle,
              padding: spacing.xs,
            }}
          >
            <MenuRow
              danger
              onPress={handleLogout}
              left={<LogOut size={16} color={colors.error} />}
              title={t('profile.logout')}
            />
          </View>
        </View>
      </DropdownModal>
    </View>
  );
}

function GhostIconButton({
  children,
  onPress,
  accessibilityLabel,
  size = 36,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  size?: number;
}) {
  const { colors, radius } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed ? colors.surfaceSoft : 'transparent',
        flexShrink: 0,
      })}
    >
      {children}
    </Pressable>
  );
}

function DropdownModal({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <Pressable
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          onPress={onClose}
        />
        {children}
      </View>
    </Modal>
  );
}

function MenuRow({
  title,
  subtitle,
  left,
  trailing,
  onPress,
  active,
  danger,
}: {
  title: string;
  subtitle?: string;
  left?: React.ReactNode;
  trailing?: React.ReactNode;
  onPress: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  const { colors, spacing, radius } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingHorizontal: spacing.md,
        paddingVertical: 12,
        borderRadius: radius.md,
        backgroundColor: active
          ? colors.primaryMuted
          : pressed
            ? colors.surfaceSoft
            : 'transparent',
      })}
    >
      {left ? <View style={{ width: 22, alignItems: 'center' }}>{left}</View> : null}
      <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
        <Text
          variant="label"
          color={danger ? colors.error : active ? colors.primary : colors.text}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" muted numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
      {active ? <Check size={16} color={colors.primary} /> : null}
    </Pressable>
  );
}
