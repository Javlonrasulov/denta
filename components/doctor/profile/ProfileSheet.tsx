import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { Text } from '@/components/ui/Text';

export function ProfileSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxHeight = '88%',
  scroll = true,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxHeight?: `${number}%`;
  scroll?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { colors, authSurface, hairline } = useLoginTheme();
  const bottomPad = Math.max(insets.bottom, 12) + 20;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent={Platform.OS === 'android'}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: 'flex-end' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
            paddingHorizontal: 20,
            paddingTop: 10,
            paddingBottom: bottomPad,
            maxHeight,
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
          <Text
            maxFontSizeMultiplier={1.1}
            style={{
              fontFamily: 'Geologica_600SemiBold',
              fontSize: 18,
              lineHeight: 24,
              color: colors.text,
            }}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              maxFontSizeMultiplier={1.15}
              style={{
                fontFamily: 'GolosText_400Regular',
                fontSize: 13,
                lineHeight: 19,
                color: colors.textSecondary,
                marginTop: 4,
                marginBottom: 10,
              }}
            >
              {subtitle}
            </Text>
          ) : (
            <View style={{ height: 12 }} />
          )}
          {scroll ? (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
              style={{ flexGrow: 0 }}
              contentContainerStyle={{ gap: 12, paddingBottom: footer ? 4 : 8 }}
            >
              {children}
            </ScrollView>
          ) : (
            <View style={{ gap: 12 }}>{children}</View>
          )}
          {footer ? (
            <View
              style={{
                marginTop: 14,
                paddingTop: 4,
                flexShrink: 0,
              }}
            >
              {footer}
            </View>
          ) : null}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
