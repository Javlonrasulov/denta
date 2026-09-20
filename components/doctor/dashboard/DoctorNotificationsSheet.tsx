import { Modal, Pressable, ScrollView, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import {
  AlertCircle,
  CalendarDays,
  Coins,
  UserRound,
  X,
} from '@/components/icons';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { Text } from '@/components/ui/Text';
import type { DoctorNotification } from '@/utils/doctorDashboard';

function iconFor(kind: DoctorNotification['kind']) {
  if (kind === 'payment') return Coins;
  if (kind === 'recall') return UserRound;
  if (kind === 'unconfirmed') return AlertCircle;
  return CalendarDays;
}

export function DoctorNotificationsSheet({
  visible,
  items,
  onClose,
  onOpen,
  onMarkAllRead,
}: {
  visible: boolean;
  items: DoctorNotification[];
  onClose: () => void;
  onOpen: (item: DoctorNotification) => void;
  onMarkAllRead: () => void;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, authSurface, hairline, isDark } = useLoginTheme();
  const unread = items.filter((item) => item.unread).length;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          onPress={onClose}
        >
          <Animated.View
            entering={FadeIn.duration(180)}
            exiting={FadeOut.duration(160)}
            style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.46)' }}
          />
        </Pressable>

        <Animated.View
          entering={SlideInDown.springify().damping(20).stiffness(220)}
          exiting={SlideOutDown.springify().damping(22).stiffness(240)}
          style={{
            backgroundColor: authSurface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            borderTopWidth: 1,
            borderColor: hairline,
            paddingTop: 10,
            paddingBottom: Math.max(insets.bottom, 16),
            maxHeight: '78%',
          }}
        >
          <View style={{ alignItems: 'center', paddingBottom: 8 }}>
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: colors.textMuted,
                opacity: 0.35,
              }}
            />
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingBottom: 12,
              gap: 12,
            }}
          >
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <Text
                style={{
                  fontFamily: 'Geologica_700Bold',
                  fontSize: 20,
                  lineHeight: 26,
                  color: colors.text,
                }}
              >
                {t('profile.notifications')}
              </Text>
              <Text
                style={{
                  fontFamily: 'GolosText_400Regular',
                  fontSize: 13,
                  lineHeight: 18,
                  color: colors.textMuted,
                }}
              >
                {unread > 0
                  ? t('notifications.unread_count', { count: unread })
                  : t('notifications.all_read')}
              </Text>
            </View>
            {unread > 0 ? (
              <Pressable onPress={onMarkAllRead} hitSlop={8}>
                <Text
                  style={{
                    fontFamily: 'GolosText_600SemiBold',
                    fontSize: 13,
                    lineHeight: 18,
                    color: colors.primary,
                  }}
                >
                  {t('notifications.mark_all_read')}
                </Text>
              </Pressable>
            ) : null}
            <ScalePressable
              accessibilityLabel={t('common.close')}
              onPress={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: hairline,
              }}
            >
              <X size={16} color={colors.textSecondary} strokeWidth={1.8} />
            </ScalePressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 12, gap: 4 }}
          >
            {items.length === 0 ? (
              <Text
                center
                style={{
                  fontFamily: 'GolosText_400Regular',
                  fontSize: 14,
                  lineHeight: 20,
                  color: colors.textMuted,
                  paddingVertical: 32,
                }}
              >
                {t('notifications.empty')}
              </Text>
            ) : (
              items.map((item) => {
                const Icon = iconFor(item.kind);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onOpen(item);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: 14,
                      borderRadius: 18,
                      backgroundColor: item.unread
                        ? isDark
                          ? 'rgba(129,140,248,0.12)'
                          : 'rgba(67,56,202,0.07)'
                        : 'transparent',
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 14,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
                        borderWidth: 1,
                        borderColor: hairline,
                      }}
                    >
                      <Icon size={18} color={colors.primary} strokeWidth={1.8} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontFamily: 'GolosText_600SemiBold',
                          fontSize: 15,
                          lineHeight: 20,
                          color: colors.text,
                        }}
                      >
                        {t(item.titleKey)}
                      </Text>
                      <Text
                        numberOfLines={2}
                        style={{
                          fontFamily: 'GolosText_400Regular',
                          fontSize: 13,
                          lineHeight: 18,
                          color: colors.textSecondary,
                        }}
                      >
                        {t(item.messageKey, item.messageParams)}
                      </Text>
                    </View>
                    {item.unread ? (
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
              })
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}