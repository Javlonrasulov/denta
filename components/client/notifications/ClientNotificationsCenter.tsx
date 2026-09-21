import { useMemo } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text as RNText,
  View,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import {
  Bell,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  CalendarX,
  CheckCircle2,
  Clock,
  Shield,
  Wallet,
  X,
  type LucideIcon,
} from '@/components/icons';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  useInboxNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from '@/hooks/useInboxNotifications';
import type { InboxNotification } from '@/services/inboxService';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/theme';
import {
  formatNotificationTime,
  hrefForInboxNotification,
  notificationDayGroup,
  type NotificationDayGroup,
} from '@/utils/inboxNotifications';

function iconFor(type: string): LucideIcon {
  const t = type.toUpperCase();
  if (t.includes('CANCEL')) return CalendarX;
  if (t.includes('RESCHEDULE')) return CalendarClock;
  if (t.includes('CONFIRM') || t.includes('CREATED') || t.includes('BOOKING')) {
    return t.includes('CONFIRM') ? CheckCircle2 : CalendarPlus;
  }
  if (t.includes('REMINDER')) return Clock;
  if (t.includes('PAYMENT')) return Wallet;
  if (t.includes('APPOINTMENT')) return CalendarDays;
  return Shield;
}

const GROUP_ORDER: NotificationDayGroup[] = ['today', 'yesterday', 'earlier'];

function isNetworkError(error: unknown): boolean {
  if (!error) return false;
  const msg = String((error as { message?: string }).message ?? error).toLowerCase();
  return (
    msg.includes('network') ||
    msg.includes('failed to fetch') ||
    msg.includes('network request failed') ||
    msg.includes('econnrefused') ||
    msg.includes('timeout')
  );
}

export function ClientNotificationsCenter({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const locale = useSettingsStore((s) => s.locale);

  const listQuery = useInboxNotifications(visible);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const groups = useMemo(() => {
    const items = listQuery.data ?? [];
    const map: Record<NotificationDayGroup, InboxNotification[]> = {
      today: [],
      yesterday: [],
      earlier: [],
    };
    for (const item of items) {
      map[notificationDayGroup(item.createdAt)].push(item);
    }
    return map;
  }, [listQuery.data]);

  const unread = useMemo(
    () => (listQuery.data ?? []).filter((n) => !n.read).length,
    [listQuery.data],
  );

  const openItem = async (item: InboxNotification) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!item.read) {
      try {
        await markRead.mutateAsync(item.id);
      } catch {
        // keep going — destination still useful
      }
    }
    const href = hrefForInboxNotification(item);
    onClose();
    if (href) {
      setTimeout(() => router.push(href as Href), 40);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 12,
            gap: 10,
            borderBottomWidth: 1,
            borderBottomColor: isDark ? colors.borderSubtle : 'rgba(15,23,42,0.06)',
          }}
        >
          <Pressable
            onPress={onClose}
            accessibilityLabel={t('common.close')}
            hitSlop={8}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)',
            }}
          >
            <X size={18} color={colors.text} strokeWidth={2} />
          </Pressable>

          <View style={{ flex: 1, minWidth: 0 }}>
            <RNText
              style={{
                fontSize: 20,
                lineHeight: 26,
                fontWeight: '700',
                color: colors.text,
                includeFontPadding: false,
              }}
            >
              {t('notifications.title')}
            </RNText>
            <RNText
              style={{
                marginTop: 2,
                fontSize: 13,
                lineHeight: 18,
                color: colors.textMuted,
                includeFontPadding: false,
              }}
            >
              {unread > 0
                ? t('notifications.unread_count', { count: unread })
                : t('notifications.all_read')}
            </RNText>
          </View>

          {unread > 0 ? (
            <Pressable
              onPress={() => markAll.mutate()}
              hitSlop={6}
              style={{ paddingVertical: 8, paddingHorizontal: 4, maxWidth: 120 }}
            >
              <RNText
                numberOfLines={2}
                style={{
                  fontSize: 12,
                  lineHeight: 15,
                  fontWeight: '600',
                  color: colors.primary,
                  textAlign: 'right',
                  includeFontPadding: false,
                }}
              >
                {t('notifications.mark_all_read')}
              </RNText>
            </Pressable>
          ) : null}
        </View>

        {listQuery.isLoading ? (
          <View style={{ padding: 16, gap: 10 }}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  gap: 12,
                  padding: 14,
                  borderRadius: 18,
                  backgroundColor: colors.surface,
                }}
              >
                <Skeleton width={44} height={44} radius={14} />
                <View style={{ flex: 1, gap: 8, paddingTop: 4 }}>
                  <Skeleton width="70%" height={14} radius={6} />
                  <Skeleton width="92%" height={12} radius={6} />
                </View>
              </View>
            ))}
          </View>
        ) : listQuery.isError ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isDark ? 'rgba(251,113,133,0.14)' : 'rgba(239,68,68,0.08)',
                marginBottom: 16,
              }}
            >
              <Bell size={26} color={colors.error} strokeWidth={1.8} />
            </View>
            <RNText
              style={{
                fontSize: 17,
                lineHeight: 24,
                fontWeight: '700',
                color: colors.text,
                textAlign: 'center',
                includeFontPadding: false,
                marginBottom: 8,
              }}
            >
              {isNetworkError(listQuery.error)
                ? t('error.network')
                : t('error.something_wrong')}
            </RNText>
            <RNText
              style={{
                fontSize: 14,
                lineHeight: 20,
                color: colors.textMuted,
                textAlign: 'center',
                marginBottom: 16,
                includeFontPadding: false,
              }}
            >
              {t('empty.try_again')}
            </RNText>
            <Pressable
              onPress={() => listQuery.refetch()}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 14,
                backgroundColor: colors.primary,
              }}
            >
              <RNText style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
                {t('common.retry')}
              </RNText>
            </Pressable>
          </View>
        ) : (listQuery.data?.length ?? 0) === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 36,
            }}
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 24,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isDark ? 'rgba(99,102,241,0.16)' : 'rgba(67,56,202,0.08)',
                marginBottom: 18,
              }}
            >
              <Bell size={30} color={colors.primary} strokeWidth={1.8} />
            </View>
            <RNText
              style={{
                fontSize: 18,
                lineHeight: 24,
                fontWeight: '700',
                color: colors.text,
                textAlign: 'center',
                includeFontPadding: false,
              }}
            >
              {t('notifications.empty_title')}
            </RNText>
            <RNText
              style={{
                marginTop: 8,
                fontSize: 14,
                lineHeight: 21,
                color: colors.textMuted,
                textAlign: 'center',
                includeFontPadding: false,
              }}
            >
              {t('notifications.empty_subtitle')}
            </RNText>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: Math.max(insets.bottom, 20) + 16,
            }}
          >
            {GROUP_ORDER.map((group) => {
              const rows = groups[group];
              if (!rows.length) return null;
              return (
                <View key={group} style={{ marginBottom: 18 }}>
                  <RNText
                    style={{
                      fontSize: 12,
                      lineHeight: 16,
                      fontWeight: '700',
                      letterSpacing: 0.4,
                      color: colors.textMuted,
                      textTransform: 'uppercase',
                      marginBottom: 8,
                      marginLeft: 4,
                      includeFontPadding: false,
                    }}
                  >
                    {t(`notifications.group_${group}`)}
                  </RNText>
                  <View style={{ gap: 8 }}>
                    {rows.map((item) => {
                      const Icon = iconFor(item.type);
                      return (
                        <Pressable
                          key={item.id}
                          onPress={() => void openItem(item)}
                          style={({ pressed }) => ({
                            flexDirection: 'row',
                            alignItems: 'flex-start',
                            gap: 12,
                            padding: 14,
                            borderRadius: 18,
                            opacity: pressed ? 0.92 : 1,
                            backgroundColor: item.read
                              ? colors.surface
                              : isDark
                                ? 'rgba(129,140,248,0.12)'
                                : 'rgba(67,56,202,0.07)',
                            borderWidth: 1,
                            borderColor: item.read
                              ? isDark
                                ? colors.borderSubtle
                                : 'rgba(15,23,42,0.05)'
                              : isDark
                                ? 'rgba(129,140,248,0.22)'
                                : 'rgba(67,56,202,0.12)',
                          })}
                        >
                          <View
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 14,
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: isDark
                                ? 'rgba(255,255,255,0.06)'
                                : 'rgba(15,23,42,0.04)',
                            }}
                          >
                            <Icon
                              size={20}
                              color={item.read ? colors.textMuted : colors.primary}
                              strokeWidth={1.9}
                            />
                          </View>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'flex-start',
                                gap: 8,
                              }}
                            >
                              <RNText
                                numberOfLines={2}
                                style={{
                                  flex: 1,
                                  fontSize: 15,
                                  lineHeight: 20,
                                  fontWeight: item.read ? '600' : '700',
                                  color: colors.text,
                                  includeFontPadding: false,
                                }}
                              >
                                {item.title}
                              </RNText>
                              <RNText
                                style={{
                                  fontSize: 11,
                                  lineHeight: 16,
                                  color: colors.textMuted,
                                  includeFontPadding: false,
                                }}
                              >
                                {formatNotificationTime(item.createdAt, locale)}
                              </RNText>
                            </View>
                            {item.body ? (
                              <RNText
                                numberOfLines={2}
                                style={{
                                  marginTop: 4,
                                  fontSize: 13,
                                  lineHeight: 18,
                                  color: colors.textMuted,
                                  includeFontPadding: false,
                                }}
                              >
                                {item.body}
                              </RNText>
                            ) : null}
                          </View>
                          {!item.read ? (
                            <View
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                marginTop: 6,
                                backgroundColor: colors.primary,
                              }}
                            />
                          ) : (
                            <View style={{ width: 8 }} />
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              );
            })}
            {markAll.isPending || markRead.isPending ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} />
            ) : null}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}
