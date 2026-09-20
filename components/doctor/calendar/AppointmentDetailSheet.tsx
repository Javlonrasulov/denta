import { Modal, Pressable, ScrollView, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { SLOT_TONE, statusKey } from '@/components/doctor/calendar/calendarTokens';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { CalendarClock, Phone, Play, UserRound, X } from '@/components/icons';
import { Avatar } from '@/components/ui/Avatar';
import { Text } from '@/components/ui/Text';
import type { FinanceRecord, Patient } from '@/types';
import type { CalendarSlot } from '@/utils/doctorCalendar';
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

export function AppointmentDetailSheet({
  slot,
  patient,
  finance,
  dateLabel,
  onClose,
  onPatient,
  onEdit,
  onCancel,
  onStart,
  onComplete,
  onPay,
}: {
  slot: CalendarSlot | null;
  patient?: Patient;
  finance?: FinanceRecord;
  dateLabel: string;
  onClose: () => void;
  onPatient?: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
  onStart?: () => void;
  onComplete?: () => void;
  onPay?: () => void;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, authSurface, hairline, field, isDark, ctaText } = useLoginTheme();
  const appointment = slot?.appointment;
  const visible = Boolean(slot && appointment);
  const tone = slot ? SLOT_TONE[slot.kind] : SLOT_TONE.pending;
  const canAct = slot?.kind === 'pending' || slot?.kind === 'confirmed' || slot?.kind === 'in_progress';
  const isCompleted = appointment?.status === 'completed' || slot?.kind === 'completed';
  const charge = appointment?.charge;
  const unpaid =
    charge &&
    (charge.status === 'unpaid' || charge.status === 'partially_paid') &&
    charge.remainingAmount > 0;

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

          {appointment && slot ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8, gap: 18 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <Avatar name={appointment.patientName} size={48} />
                <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                  <Text
                    style={{
                      fontFamily: 'Geologica_700Bold',
                      fontSize: 20,
                      lineHeight: 26,
                      color: colors.text,
                    }}
                  >
                    {appointment.patientName}
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'GolosText_400Regular',
                      fontSize: 13,
                      lineHeight: 18,
                      color: colors.textSecondary,
                    }}
                  >
                    {appointment.serviceName}
                  </Text>
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

              <View style={{ alignSelf: 'flex-start' }}>
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 10,
                    backgroundColor: isDark ? tone.bgDark : tone.bg,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'GolosText_600SemiBold',
                      fontSize: 12,
                      lineHeight: 16,
                      color: isDark ? tone.labelDark : tone.label,
                    }}
                  >
                    {t(statusKey(slot.kind))}
                  </Text>
                </View>
              </View>

              <View style={{ gap: 14 }}>
                <Row label={t('profile.phone')} value={patient?.phone} />
                <Row label={t('doctor_app.visit_date')} value={dateLabel} />
                <Row label={t('doctor_app.visit_time')} value={`${slot.start} – ${slot.end}`} />
                <Row label={t('doctor_app.visit_service')} value={appointment.serviceName} />
                <Row label={t('patients.notes')} value={appointment.notes ?? patient?.notes} />
                {finance ? (
                  <Row
                    label={
                      finance.paymentStatus === 'paid'
                        ? t('finance.paid')
                        : t('doctor_app.visit_payment')
                    }
                    value={`${formatSom(finance.amount)} ${t('common.currency')} · ${t(
                      `finance.${finance.paymentStatus}`,
                    )}`}
                  />
                ) : appointment.price ? (
                  <Row
                    label={t('doctor_app.visit_payment')}
                    value={`${formatSom(appointment.price)} ${t('common.currency')}`}
                  />
                ) : null}
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <ScalePressable
                  accessibilityLabel={t('doctor_app.patient_card')}
                  onPress={onPatient}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    height: 48,
                    borderRadius: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    backgroundColor: field,
                    borderWidth: 1,
                    borderColor: hairline,
                  }}
                >
                  <UserRound size={16} color={colors.primary} strokeWidth={1.8} />
                  <Text
                    numberOfLines={1}
                    style={{
                      fontFamily: 'GolosText_600SemiBold',
                      fontSize: 13,
                      lineHeight: 18,
                      color: colors.text,
                    }}
                  >
                    {t('doctor_app.patient_card')}
                  </Text>
                </ScalePressable>
                {patient?.phone ? (
                  <ScalePressable
                    accessibilityLabel={t('doctor_app.call')}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      void Linking.openURL(`tel:${patient.phone}`);
                    }}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: field,
                      borderWidth: 1,
                      borderColor: hairline,
                    }}
                  >
                    <Phone size={16} color={colors.primary} strokeWidth={1.8} />
                  </ScalePressable>
                ) : null}
              </View>

              {canAct ? (
                <View style={{ gap: 8 }}>
                  <ScalePressable
                    accessibilityLabel={t('doctor_app.start_visit')}
                    onPress={onStart}
                    style={{
                      height: 50,
                      borderRadius: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      backgroundColor: colors.primary,
                    }}
                  >
                    <Play size={16} color={ctaText} strokeWidth={2} />
                    <Text
                      style={{
                        fontFamily: 'GolosText_600SemiBold',
                        fontSize: 15,
                        lineHeight: 20,
                        color: ctaText,
                      }}
                    >
                      {t('doctor_app.start_visit')}
                    </Text>
                  </ScalePressable>
                  <ScalePressable
                    accessibilityLabel={t('appointments.status_completed')}
                    onPress={onComplete}
                    style={{
                      height: 46,
                      borderRadius: 16,
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
                        lineHeight: 18,
                        color: colors.text,
                      }}
                    >
                      {t('appointments.status_completed')}
                    </Text>
                  </ScalePressable>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <ScalePressable
                      accessibilityLabel={t('doctor_app.edit_appointment')}
                      onPress={onEdit}
                      style={{
                        flex: 1,
                        height: 46,
                        borderRadius: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        backgroundColor: field,
                        borderWidth: 1,
                        borderColor: hairline,
                      }}
                    >
                      <CalendarClock size={15} color={colors.textSecondary} strokeWidth={1.8} />
                      <Text
                        style={{
                          fontFamily: 'GolosText_600SemiBold',
                          fontSize: 13,
                          lineHeight: 18,
                          color: colors.text,
                        }}
                      >
                        {t('doctor_app.edit_appointment')}
                      </Text>
                    </ScalePressable>
                    <ScalePressable
                      accessibilityLabel={t('appointments.cancel_appointment')}
                      onPress={onCancel}
                      style={{
                        flex: 1,
                        height: 46,
                        borderRadius: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.08)',
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'GolosText_600SemiBold',
                          fontSize: 13,
                          lineHeight: 18,
                          color: colors.error,
                        }}
                      >
                        {t('common.cancel')}
                      </Text>
                    </ScalePressable>
                  </View>
                </View>
              ) : null}

              {isCompleted ? (
                <View style={{ gap: 8 }}>
                  <Text
                    style={{
                      fontFamily: 'GolosText_500Medium',
                      fontSize: 13,
                      lineHeight: 18,
                      color: colors.textSecondary,
                    }}
                  >
                    {charge
                      ? `${t('crm.finance.outstanding', { defaultValue: 'Outstanding' })}: ${charge.remainingAmount.toLocaleString()} / ${charge.amount.toLocaleString()} (${charge.status})`
                      : t('doctor_app.no_charge', { defaultValue: 'No charge' })}
                  </Text>
                  {unpaid ? (
                    <ScalePressable
                      accessibilityLabel={t('crm.finance.full_pay', { defaultValue: 'Pay in full' })}
                      onPress={onPay}
                      style={{
                        height: 50,
                        borderRadius: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: colors.primary,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'GolosText_600SemiBold',
                          fontSize: 15,
                          lineHeight: 20,
                          color: ctaText,
                        }}
                      >
                        {t('crm.finance.full_pay', { defaultValue: 'Pay in full' })}
                      </Text>
                    </ScalePressable>
                  ) : null}
                </View>
              ) : null}
            </ScrollView>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}
