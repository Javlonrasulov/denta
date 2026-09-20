import { Modal, Pressable, ScrollView, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { Check } from '@/components/icons';
import { Text } from '@/components/ui/Text';
import type { PaymentStatus } from '@/types';
import type { FinanceStatusFilter, FinanceTypeFilter } from '@/utils/doctorFinance';

const TYPES: FinanceTypeFilter[] = ['all', 'income', 'expense'];
const STATUSES: FinanceStatusFilter[] = ['all', 'paid', 'pending', 'partial', 'overdue', 'cancelled'];

function Options<T extends string>({
  title,
  value,
  options,
  labelFor,
  onChange,
}: {
  title: string;
  value: T;
  options: T[];
  labelFor: (key: T) => string;
  onChange: (value: T) => void;
}) {
  const { colors, field, hairline } = useLoginTheme();
  return (
    <View style={{ gap: 8 }}>
      <Text
        style={{
          fontFamily: 'Geologica_600SemiBold',
          fontSize: 13,
          lineHeight: 18,
          color: colors.textMuted,
        }}
      >
        {title}
      </Text>
      {options.map((key) => {
        const selected = value === key;
        return (
          <Pressable
            key={key}
            onPress={() => {
              void Haptics.selectionAsync();
              onChange(key);
            }}
            style={{
              minHeight: 46,
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
                color: selected ? colors.primary : colors.text,
              }}
            >
              {labelFor(key)}
            </Text>
            {selected ? <Check size={16} color={colors.primary} strokeWidth={2.2} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export function FinanceFilterSheet({
  visible,
  type,
  status,
  onClose,
  onType,
  onStatus,
}: {
  visible: boolean;
  type: FinanceTypeFilter;
  status: FinanceStatusFilter;
  onClose: () => void;
  onType: (value: FinanceTypeFilter) => void;
  onStatus: (value: FinanceStatusFilter) => void;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, authSurface } = useLoginTheme();

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
            }}
          >
            {t('doctor_finance.filter_title')}
          </Text>
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 460 }}
            contentContainerStyle={{ gap: 16, paddingBottom: 4 }}
          >
          <Options
            title={t('doctor_finance.filter_type')}
            value={type}
            options={TYPES}
            onChange={onType}
            labelFor={(key) =>
              key === 'all'
                ? t('doctor_finance.filter_all')
                : key === 'income'
                  ? t('finance.income')
                  : t('finance.expenses')
            }
          />
          <Options
            title={t('doctor_finance.filter_status')}
            value={status}
            options={STATUSES}
            onChange={(value) => onStatus(value as FinanceStatusFilter)}
            labelFor={(key) =>
              key === 'all'
                ? t('doctor_finance.filter_all')
                : t(`doctor_finance.status_${key as PaymentStatus}`)
            }
          />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
