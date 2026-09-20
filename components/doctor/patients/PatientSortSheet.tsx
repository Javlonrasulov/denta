import { Modal, Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { Check } from '@/components/icons';
import { Text } from '@/components/ui/Text';
import type { PatientSort } from '@/utils/doctorPatients';

const SORTS: PatientSort[] = ['last_visit', 'next', 'az', 'newest', 'debt'];

export function PatientSortSheet({
  visible,
  value,
  onClose,
  onChange,
}: {
  visible: boolean;
  value: PatientSort;
  onClose: () => void;
  onChange: (value: PatientSort) => void;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, authSurface, field, hairline } = useLoginTheme();

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
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
            paddingBottom: Math.max(insets.bottom, 20) + 16,
            gap: 14,
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
            }}
          >
            {t('patients.sort_title')}
          </Text>
          <View style={{ gap: 8 }}>
            {SORTS.map((key) => {
              const selected = value === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    onChange(key);
                    onClose();
                  }}
                  style={{
                    minHeight: 48,
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: selected ? field : 'transparent',
                    borderWidth: 1,
                    borderColor: selected ? colors.primary : hairline,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: selected ? 'GolosText_600SemiBold' : 'GolosText_500Medium',
                      fontSize: 15,
                      lineHeight: 20,
                      color: selected ? colors.primary : colors.text,
                    }}
                  >
                    {t(`patients.sort_${key}`)}
                  </Text>
                  {selected ? <Check size={18} color={colors.primary} strokeWidth={2.2} /> : null}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
