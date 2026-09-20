import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { PaymentStatusBadge } from '@/components/doctor/finance/PaymentStatusBadge';
import { X } from '@/components/icons';
import { Text } from '@/components/ui/Text';
import type { FinanceRecord } from '@/types';
import { formatFinanceDate, isOutstandingStatus } from '@/utils/doctorFinance';
import { formatSom } from '@/utils/slots';

function Row({ label, value }: { label: string; value?: string | null }) {
  const { colors } = useLoginTheme();
  if (!value) return null;
  return (
    <View style={{ gap: 3 }}>
      <Text
        style={{
          fontFamily: 'Geologica_600SemiBold',
          fontSize: 11,
          lineHeight: 14,
          letterSpacing: 0.6,
          color: colors.textMuted,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: 'GolosText_500Medium',
          fontSize: 15,
          lineHeight: 21,
          color: colors.text,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

export function PaymentDetailSheet({
  record,
  onClose,
  onEdit,
  onReceipt,
  onConfirm,
}: {
  record: FinanceRecord | null;
  onClose: () => void;
  onEdit?: () => void;
  onReceipt?: () => void;
  onConfirm?: () => void;
}) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, authSurface, hairline, field } = useLoginTheme();
  const visible = Boolean(record);
  const canConfirm = record ? isOutstandingStatus(record.paymentStatus) : false;
  const amountColor =
    record?.type === 'expense' ? colors.warning : colors.success;
  const sign = record?.type === 'expense' ? '−' : '+';

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
            borderTopWidth: 1,
            borderColor: hairline,
            paddingTop: 10,
            paddingBottom: Math.max(insets.bottom, 16),
            maxHeight: '82%',
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

          {record ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8, gap: 16 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
                  <Text
                    style={{
                      fontFamily: 'Geologica_700Bold',
                      fontSize: 20,
                      lineHeight: 26,
                      color: colors.text,
                    }}
                  >
                    {record.serviceName}
                  </Text>
                  <PaymentStatusBadge status={record.paymentStatus} />
                </View>
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

              <Text
                style={{
                  fontFamily: 'Geologica_700Bold',
                  fontSize: 28,
                  lineHeight: 34,
                  letterSpacing: -0.6,
                  color: amountColor,
                }}
              >
                {`${sign}${formatSom(record.amount)} ${t('common.currency')}`}
              </Text>

              <Row
                label={t('doctor_finance.patient')}
                value={record.patientName ?? t('doctor_finance.no_patient')}
              />
              <Row label={t('doctor_finance.service')} value={record.serviceName} />
              <Row
                label={t('doctor_finance.date')}
                value={[formatFinanceDate(record.date, i18n.language), record.time]
                  .filter(Boolean)
                  .join('  ·  ')}
              />
              <Row
                label={t('doctor_finance.method')}
                value={
                  record.paymentMethod
                    ? t(`doctor_finance.method_${record.paymentMethod}`)
                    : undefined
                }
              />
              <Row label={t('doctor_finance.note')} value={record.notes} />

              <View style={{ gap: 8, marginTop: 4 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <ScalePressable
                    accessibilityLabel={t('doctor_finance.edit')}
                    onPress={onEdit}
                    style={{
                      flex: 1,
                      height: 44,
                      borderRadius: 14,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: field,
                      borderWidth: 1,
                      borderColor: hairline,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'GolosText_600SemiBold',
                        fontSize: 14,
                        color: colors.text,
                      }}
                    >
                      {t('doctor_finance.edit')}
                    </Text>
                  </ScalePressable>
                  <ScalePressable
                    accessibilityLabel={t('doctor_finance.receipt')}
                    onPress={onReceipt}
                    style={{
                      flex: 1,
                      height: 44,
                      borderRadius: 14,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: field,
                      borderWidth: 1,
                      borderColor: hairline,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'GolosText_600SemiBold',
                        fontSize: 14,
                        color: colors.text,
                      }}
                    >
                      {t('doctor_finance.receipt')}
                    </Text>
                  </ScalePressable>
                </View>
                {canConfirm ? (
                  <ScalePressable
                    accessibilityLabel={t('doctor_finance.confirm_payment')}
                    onPress={onConfirm}
                    style={{
                      height: 48,
                      borderRadius: 14,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: colors.primary,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'GolosText_600SemiBold',
                        fontSize: 15,
                        color: '#FFFFFF',
                      }}
                    >
                      {t('doctor_finance.confirm_payment')}
                    </Text>
                  </ScalePressable>
                ) : null}
              </View>
            </ScrollView>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}
