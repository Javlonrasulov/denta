import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import type { CreateFinanceInput } from '@/services/financeService';
import type { FinanceRecord, Patient, PaymentMethod } from '@/types';

const METHODS: PaymentMethod[] = ['card', 'cash', 'transfer'];

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors, field, hairline, isDark } = useLoginTheme();
  return (
    <Pressable
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={{
        height: 36,
        paddingHorizontal: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: selected
          ? isDark
            ? 'rgba(129,140,248,0.18)'
            : 'rgba(67,56,202,0.1)'
          : field,
        borderWidth: 1,
        borderColor: selected ? colors.primary : hairline,
      }}
    >
      <Text
        style={{
          fontFamily: 'GolosText_600SemiBold',
          fontSize: 12,
          color: selected ? colors.primary : colors.textSecondary,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function AddPaymentSheet({
  visible,
  initialType,
  record,
  patients,
  services,
  onClose,
  onSave,
}: {
  visible: boolean;
  initialType?: 'income' | 'expense';
  record?: FinanceRecord | null;
  patients: Patient[];
  services: string[];
  onClose: () => void;
  onSave: (input: CreateFinanceInput, id?: string) => Promise<void> | void;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, authSurface } = useLoginTheme();
  const [type, setType] = useState<'income' | 'expense'>(initialType ?? 'income');
  const [amount, setAmount] = useState('');
  const [service, setService] = useState('');
  const [patientName, setPatientName] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (record) {
      setType(record.type);
      setAmount(String(record.amount));
      setService(record.serviceName);
      setPatientName(record.patientName ?? '');
      setMethod(record.paymentMethod ?? 'card');
      setNotes(record.notes ?? '');
      return;
    }
    setType(initialType ?? 'income');
    setAmount('');
    setService('');
    setPatientName('');
    setMethod('card');
    setNotes('');
    setError(null);
  }, [initialType, record, visible]);

  const close = () => {
    setError(null);
    setSaving(false);
    onClose();
  };

  const submit = async () => {
    const value = Number(String(amount).replace(/\s/g, '').replace(',', '.'));
    if (!Number.isFinite(value) || value <= 0) {
      setError(t('doctor_finance.amount_invalid'));
      return;
    }
    if (!service.trim()) {
      setError(t('doctor_finance.required'));
      return;
    }
    setSaving(true);
    try {
      const match = patients.find((patient) => patient.fullName === patientName.trim());
      await onSave(
        {
          type,
          amount: Math.round(value),
          serviceName: service.trim(),
          patientName: patientName.trim() || undefined,
          patientId: match?.id,
          paymentMethod: method,
          notes: notes.trim() || undefined,
          paymentStatus: type === 'expense' ? 'paid' : 'paid',
        },
        record?.id,
      );
      close();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close} statusBarTranslucent>
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: 'flex-end' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} onPress={close}>
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
            paddingBottom: Math.max(insets.bottom, 16) + 12,
            height: '88%',
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
            style={{
              fontFamily: 'Geologica_600SemiBold',
              fontSize: 18,
              lineHeight: 24,
              color: colors.text,
              marginBottom: 14,
            }}
          >
            {type === 'income' ? t('doctor_finance.add_payment') : t('doctor_finance.add_expense')}
          </Text>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={{ gap: 12, paddingBottom: 8 }}
          >
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Chip
                label={t('finance.income')}
                selected={type === 'income'}
                onPress={() => setType('income')}
              />
              <Chip
                label={t('finance.expenses')}
                selected={type === 'expense'}
                onPress={() => setType('expense')}
              />
            </View>
            <Input
              label={t('doctor_finance.amount')}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
            <Input
              label={t('doctor_finance.service')}
              value={service}
              onChangeText={setService}
            />
            {services.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {services.slice(0, 8).map((name) => (
                  <Chip key={name} label={name} selected={service === name} onPress={() => setService(name)} />
                ))}
              </ScrollView>
            ) : null}
            {type === 'income' ? (
              <Input
                label={t('doctor_finance.patient')}
                value={patientName}
                onChangeText={setPatientName}
                autoCapitalize="words"
              />
            ) : null}
            {type === 'income' && patients.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {patients.slice(0, 8).map((patient) => (
                  <Chip
                    key={patient.id}
                    label={patient.fullName}
                    selected={patientName === patient.fullName}
                    onPress={() => setPatientName(patient.fullName)}
                  />
                ))}
              </ScrollView>
            ) : null}
            <View style={{ gap: 6 }}>
              <Text variant="label" color={colors.textSecondary}>
                {t('doctor_finance.method')}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {METHODS.map((key) => (
                  <Chip
                    key={key}
                    label={t(`doctor_finance.method_${key}`)}
                    selected={method === key}
                    onPress={() => setMethod(key)}
                  />
                ))}
              </View>
            </View>
            <Input
              label={t('doctor_finance.note')}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
            {error ? (
              <Text variant="caption" color={colors.error}>
                {error}
              </Text>
            ) : null}
            <ScalePressable
              accessibilityLabel={t('doctor_finance.save_record')}
              disabled={saving}
              onPress={() => void submit()}
              style={{
                height: 48,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.primary,
                opacity: saving ? 0.6 : 1,
                marginTop: 4,
              }}
            >
              <Text
                style={{
                  fontFamily: 'GolosText_600SemiBold',
                  fontSize: 15,
                  color: '#FFFFFF',
                }}
              >
                {t('doctor_finance.save_record')}
              </Text>
            </ScalePressable>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
