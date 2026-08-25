import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { Href, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  CalendarDays,
  Check,
  Coins,
  Package,
  UserPlus,
  X,
  type LucideIcon,
} from '@/components/icons';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';
import type { NotificationType } from '@/services/notificationService';

export interface AppNotification {
  id: string;
  type: NotificationType;
  titleKey: string;
  body: string;
  time: string;
  href: Href;
  read: boolean;
}

const INITIAL: AppNotification[] = [
  {
    id: 'n1',
    type: 'appointment_reminder',
    titleKey: 'notifications.appointment_reminder',
    body: 'Javlonbek Karimov · 10:00 · Consultation',
    time: '09:15',
    href: '/(clinic)/(shell)/appointments',
    read: false,
  },
  {
    id: 'n2',
    type: 'new_patient',
    titleKey: 'notifications.new_patient',
    body: 'Shahnoza Ismoilova added to clinic',
    time: '08:40',
    href: '/(clinic)/(shell)/patients',
    read: false,
  },
  {
    id: 'n3',
    type: 'low_inventory',
    titleKey: 'notifications.low_inventory',
    body: 'Anesthesia cartridges — 8 boxes left',
    time: '08:05',
    href: '/(clinic)/(shell)/inventory',
    read: false,
  },
  {
    id: 'n4',
    type: 'payment',
    titleKey: 'notifications.payment',
    body: 'Malika Sobirova · 450,000 UZS',
    time: 'Yesterday',
    href: '/(clinic)/(shell)/finance',
    read: true,
  },
  {
    id: 'n5',
    type: 'booking_confirmed',
    titleKey: 'notifications.booking_confirmed',
    body: 'Azizbek Toshmatov · Aug 25 · 11:00',
    time: 'Yesterday',
    href: '/(clinic)/(shell)/appointments',
    read: true,
  },
  {
    id: 'n6',
    type: 'schedule_changed',
    titleKey: 'notifications.schedule_changed',
    body: 'Dr. Dilnoza Karimova — break 13:30–14:30',
    time: '2d',
    href: '/(clinic)/(shell)/doctors',
    read: true,
  },
];

const ICON_BY_TYPE: Record<NotificationType, LucideIcon> = {
  booking_confirmed: Check,
  booking_cancelled: X,
  appointment_reminder: CalendarDays,
  schedule_changed: CalendarDays,
  new_patient: UserPlus,
  payment: Coins,
  low_inventory: Package,
};

interface NotificationsPanelProps {
  visible: boolean;
  onClose: () => void;
  anchor: { top: number; right: number };
  onUnreadChange?: (count: number) => void;
}

export function NotificationsPanel({
  visible,
  onClose,
  anchor,
  onUnreadChange,
}: NotificationsPanelProps) {
  const { t } = useTranslation();
  const { colors, spacing, radius, shadows, iconSizes } = useTheme();
  const [items, setItems] = useState(INITIAL);

  const unread = useMemo(() => items.filter((n) => !n.read).length, [items]);

  React.useEffect(() => {
    onUnreadChange?.(unread);
  }, [unread, onUnreadChange]);

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const openItem = (item: AppNotification) => {
    setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
    onClose();
    router.push(item.href);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <Pressable
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          onPress={onClose}
        />
        <View
          style={{
            position: 'absolute',
            top: anchor.top,
            right: anchor.right,
            width: 360,
            maxWidth: '92%',
            maxHeight: 440,
            backgroundColor: colors.surface,
            borderRadius: radius.xl,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            overflow: 'hidden',
            ...shadows.lg,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: colors.borderSubtle,
              gap: spacing.sm,
            }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="h3">{t('profile.notifications')}</Text>
              <Text variant="caption" muted>
                {unread > 0
                  ? t('notifications.unread_count', { count: unread })
                  : t('notifications.all_read')}
              </Text>
            </View>
            {unread > 0 ? (
              <Pressable onPress={markAllRead} hitSlop={8}>
                <Text variant="caption" weight="semibold" color={colors.primary}>
                  {t('notifications.mark_all_read')}
                </Text>
              </Pressable>
            ) : null}
          </View>

          <ScrollView
            style={{ maxHeight: 360 }}
            contentContainerStyle={{ padding: spacing.sm }}
            showsVerticalScrollIndicator={false}
          >
            {items.length === 0 ? (
              <Text variant="bodySmall" muted center style={{ padding: spacing.xl }}>
                {t('notifications.empty')}
              </Text>
            ) : (
              items.map((item) => {
                const Icon = item.type === 'low_inventory' ? AlertTriangle : ICON_BY_TYPE[item.type];
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => openItem(item)}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      gap: spacing.md,
                      padding: spacing.md,
                      borderRadius: radius.lg,
                      backgroundColor: pressed
                        ? colors.primaryMuted
                        : item.read
                          ? 'transparent'
                          : colors.primaryMuted,
                    })}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: radius.md,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: colors.surfaceSoft,
                      }}
                    >
                      <Icon
                        size={iconSizes.sm}
                        color={item.type === 'low_inventory' ? colors.warning : colors.primary}
                      />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: spacing.sm,
                        }}
                      >
                        <Text variant="label" numberOfLines={1} style={{ flex: 1 }}>
                          {t(item.titleKey)}
                        </Text>
                        <Text variant="caption" muted>
                          {item.time}
                        </Text>
                      </View>
                      <Text variant="caption" muted numberOfLines={2}>
                        {item.body}
                      </Text>
                    </View>
                    {!item.read ? (
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          marginTop: 6,
                          backgroundColor: colors.secondary,
                        }}
                      />
                    ) : (
                      <View style={{ width: 8 }} />
                    )}
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function getInitialUnreadCount() {
  return INITIAL.filter((n) => !n.read).length;
}
