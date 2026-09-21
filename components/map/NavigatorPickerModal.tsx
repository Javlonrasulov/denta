import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text as RNText,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { Navigation } from '@/components/icons';
import { useTheme } from '@/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onYandex: () => void;
  onGoogle: () => void;
};

export function NavigatorPickerModal({
  visible,
  onClose,
  onYandex,
  onGoogle,
}: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              paddingBottom: Math.max(insets.bottom, 14),
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, marginBottom: 14 }}>
            <Navigation size={18} color={colors.primary} />
            <RNText
              style={{
                fontSize: 17,
                fontWeight: '700',
                color: colors.text,
                includeFontPadding: false,
              }}
            >
              {t('map.choose_navigator')}
            </RNText>
          </View>

          {[
            { key: 'yandex', label: t('map.yandex_navigator'), onPress: onYandex },
            { key: 'google', label: t('map.google_maps'), onPress: onGoogle },
          ].map((opt) => (
            <Pressable
              key={opt.key}
              onPress={() => {
                void Haptics.selectionAsync();
                opt.onPress();
              }}
              style={[
                styles.row,
                {
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.surfaceSoft,
                },
              ]}
            >
              <RNText
                style={{
                  fontSize: 15,
                  fontWeight: '700',
                  color: colors.text,
                  includeFontPadding: false,
                  fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : undefined,
                }}
              >
                {opt.label}
              </RNText>
            </Pressable>
          ))}

          <Pressable onPress={onClose} style={styles.cancel}>
            <RNText
              style={{
                fontSize: 15,
                fontWeight: '600',
                color: colors.textMuted,
                textAlign: 'center',
                includeFontPadding: false,
              }}
            >
              {t('common.cancel')}
            </RNText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.45)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingHorizontal: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: 14,
  },
  row: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    paddingHorizontal: 14,
  },
  cancel: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
});
