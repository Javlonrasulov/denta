import { Pressable, View, Modal } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { Check } from '@/components/icons';
import { LOCALE_OPTIONS } from '@/components/ui/LanguageMenu';
import { Text } from '@/components/ui/Text';
import { useSettingsStore } from '@/store/settingsStore';
import type { LocaleCode } from '@/types';
import { useLoginTheme } from '@/components/auth/loginTheme';

export function LanguageBottomSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, authSurface, field, hairline } = useLoginTheme();
  const locale = useSettingsStore((s) => s.locale);
  const setLocale = useSettingsStore((s) => s.setLocale);

  const onSelect = (code: LocaleCode) => {
    void Haptics.selectionAsync();
    setLocale(code);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} onPress={onClose}>
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
            paddingHorizontal: 20,
            paddingTop: 10,
            paddingBottom: Math.max(insets.bottom, 24) + 20,
            gap: 16,
          }}
        >
          <View style={{ alignItems: 'center', paddingBottom: 4 }}>
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
            style={{
              fontFamily: 'Geologica_600SemiBold',
              fontSize: 18,
              lineHeight: 24,
              color: colors.text,
              paddingRight: 8,
            }}
          >
            {t('auth.select_language')}
          </Text>
          <View style={{ gap: 6 }}>
            {LOCALE_OPTIONS.map((item) => {
              const active = item.code === locale;
              return (
                <Pressable
                  key={item.code}
                  onPress={() => onSelect(item.code)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={{
                    minHeight: 52,
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: active ? colors.primaryMuted : field,
                    borderWidth: 1,
                    borderColor: active ? colors.primary : hairline,
                  }}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      style={{
                        fontFamily: active ? 'GolosText_600SemiBold' : 'GolosText_500Medium',
                        fontSize: 16,
                        lineHeight: 22,
                        color: active ? colors.primary : colors.text,
                        paddingRight: 8,
                      }}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                  </View>
                  <View style={{ width: 22, alignItems: 'flex-end' }}>
                    {active ? <Check size={18} color={colors.primary} strokeWidth={2.4} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
