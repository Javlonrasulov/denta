import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { TransactionRow } from '@/components/doctor/finance/TransactionRow';
import { Text } from '@/components/ui/Text';
import type { FinanceRecord } from '@/types';

export function TransactionsList({
  records,
  onOpen,
}: {
  records: FinanceRecord[];
  onOpen: (record: FinanceRecord) => void;
}) {
  const { t } = useTranslation();
  const { colors, authSurface, hairline } = useLoginTheme();

  if (records.length === 0) return null;

  return (
    <Animated.View entering={FadeInDown.duration(260).delay(150)} style={{ gap: 10 }}>
      <Text
        style={{
          fontFamily: 'Geologica_600SemiBold',
          fontSize: 16,
          lineHeight: 22,
          color: colors.text,
        }}
      >
        {t('doctor_finance.history')}
      </Text>
      <View
        style={{
          backgroundColor: authSurface,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: hairline,
          paddingHorizontal: 12,
          paddingVertical: 4,
        }}
      >
        {records.map((record, index) => (
          <TransactionRow
            key={record.id}
            record={record}
            last={index === records.length - 1}
            onPress={() => onOpen(record)}
          />
        ))}
      </View>
    </Animated.View>
  );
}
