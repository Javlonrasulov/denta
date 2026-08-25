import React, { useRef, useState } from 'react';
import { Modal, Pressable, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Bell, Check, Globe, LogOut, Menu, Moon, Search, Sun } from '@/components/icons';

import { Avatar } from '@/components/ui/Avatar';
import { Text } from '@/components/ui/Text';
import { FontSizeControl } from '@/components/layout/FontSizeControl';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/theme';
import { LocaleCode } from '@/types';

const LOCALES: { code: LocaleCode; label: string; short: string }[] = [
  { code: 'uz', label: 'O‘zbekcha', short: 'UZ' },
  { code: 'uz-Cyrl', label: 'Ўзбекча', short: 'ЎЗ' },
  { code: 'ru', label: 'Русский', short: 'RU' },
  { code: 'en', label: 'English', short: 'EN' },
];

const MENU_WIDTH = 200;

interface TopHeaderProps {
  title: string;
  subtitle?: string;
  onMenuPress?: () => void;
  showMenu?: boolean;
}

export function TopHeader({ title, subtitle, onMenuPress, showMenu }: TopHeaderProps) {
  const { t } = useTranslation();
  const { colors, spacing, radius, layout, iconSizes, isDark, shadows, isDesktop } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const locale = useSettingsStore((s) => s.locale);
  const setLocale = useSettingsStore((s) => s.setLocale);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const adminName = useSettingsStore((s) => s.adminName);
  const logout = useSettingsStore((s) => s.logout);
  const [langOpen, setLangOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const langBtnRef = useRef<View>(null);

  const currentLocale = LOCALES.find((item) => item.code === locale) ?? LOCALES[0];

  const openLanguageMenu = () => {
    langBtnRef.current?.measureInWindow((x, y, width, height) => {
      const centered = x + width / 2 - MENU_WIDTH / 2;
      const left = Math.min(Math.max(8, centered), windowWidth - MENU_WIDTH - 8);
      setMenuPos({ top: y + height + 6, left });
      setLangOpen(true);
    });
  };

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <View
      style={{
        minHeight: layout.headerHeight,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderSubtle,
        gap: spacing.lg,
        zIndex: 20,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 }}>
        {showMenu ? (
          <Pressable
            onPress={onMenuPress}
            accessibilityRole="button"
            style={{
              width: 40,
              height: 40,
              borderRadius: radius.md,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.surfaceSoft,
            }}
          >
            <Menu size={iconSizes.md} color={colors.text} />
          </Pressable>
        ) : null}
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="h3">{title}</Text>
          {subtitle ? (
            <Text variant="caption" muted numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View ref={langBtnRef} collapsable={false}>
          <HeaderIconButton
            accessibilityLabel={t('profile.language')}
            onPress={openLanguageMenu}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Globe size={iconSizes.sm} color={colors.textSecondary} />
              <Text variant="caption" weight="semibold" color={colors.textSecondary}>
                {currentLocale.short}
              </Text>
            </View>
          </HeaderIconButton>
        </View>

        <HeaderIconButton
          accessibilityLabel={t('profile.dark_mode')}
          onPress={() => setThemeMode(isDark ? 'light' : 'dark')}
        >
          {isDark ? (
            <Sun size={iconSizes.sm} color={colors.textSecondary} />
          ) : (
            <Moon size={iconSizes.sm} color={colors.textSecondary} />
          )}
        </HeaderIconButton>

        {isDesktop ? <FontSizeControl /> : null}

        <HeaderIconButton>
          <Search size={iconSizes.sm} color={colors.textSecondary} />
        </HeaderIconButton>
        <View style={{ position: 'relative' }}>
          <HeaderIconButton>
            <Bell size={iconSizes.sm} color={colors.textSecondary} />
          </HeaderIconButton>
          <View
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 7,
              height: 7,
              borderRadius: 4,
              backgroundColor: colors.error,
              borderWidth: 1.5,
              borderColor: colors.surface,
            }}
          />
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            paddingLeft: spacing.sm,
            marginLeft: spacing.xs,
            borderLeftWidth: 1,
            borderLeftColor: colors.borderSubtle,
          }}
        >
          <Avatar name={adminName} size={32} />
          <Text variant="caption" weight="semibold" numberOfLines={1}>
            {adminName}
          </Text>
          <Pressable
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel={t('profile.logout')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              height: 36,
              paddingHorizontal: spacing.md,
              borderRadius: radius.md,
              backgroundColor: colors.errorMuted,
            }}
          >
            <LogOut size={14} color={colors.error} />
            <Text variant="caption" weight="semibold" color={colors.error}>
              {t('profile.logout')}
            </Text>
          </Pressable>
        </View>
      </View>

      <Modal
        visible={langOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setLangOpen(false)}
      >
        <View style={{ flex: 1 }}>
          <Pressable
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
            onPress={() => setLangOpen(false)}
          />
          <View
            style={{
              position: 'absolute',
              top: menuPos.top,
              left: menuPos.left,
              width: MENU_WIDTH,
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              padding: spacing.xs,
              ...shadows.lg,
            }}
          >
            <Text
              variant="caption"
              muted
              style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}
            >
              {t('profile.language')}
            </Text>
            {LOCALES.map((item) => {
              const active = item.code === locale;
              return (
                <Pressable
                  key={item.code}
                  onPress={() => {
                    setLocale(item.code);
                    setLangOpen(false);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: spacing.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.md,
                    borderRadius: radius.md,
                    backgroundColor: active ? colors.primaryMuted : 'transparent',
                  }}
                >
                  <Text variant="label" color={active ? colors.primary : colors.text}>
                    {item.label}
                  </Text>
                  {active ? <Check size={16} color={colors.primary} /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function HeaderIconButton({
  children,
  onPress,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const { colors, radius } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={{
        minWidth: 40,
        height: 40,
        paddingHorizontal: 10,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surfaceSoft,
      }}
    >
      {children}
    </Pressable>
  );
}
