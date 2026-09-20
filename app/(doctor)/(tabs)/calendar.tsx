import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import {
  AppointmentDetailSheet,
  CalendarFilters,
  CalendarHeader,
  CalendarSkeleton,
  CalendarViewSwitcher,
  DateStrip,
  DayTimeline,
  MonthGrid,
  WeekAgenda,
  WorkingHoursSummary,
} from '@/components/doctor/calendar';
import { MobileScreen } from '@/components/mobile';
import { ErrorState } from '@/components/states/EmptyState';
import { Text } from '@/components/ui/Text';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { useDoctorCalendar } from '@/hooks/useDoctorCalendar';
import { cancelAppointment, updateAppointmentStatus } from '@/services/appointmentService';
import { createFinanceRecord } from '@/services/financeService';
import { useToastStore } from '@/store/toastStore';
import type { CalendarFilter, CalendarSlot, CalendarView } from '@/utils/doctorCalendar';
import {
  dateFromKey,
  financeForPatient,
  formatMonthTitle,
  formatScheduleDate,
  patientForAppointment,
} from '@/utils/doctorCalendar';
import { localDateKey } from '@/utils/doctorDashboard';

export default function DoctorCalendarScreen() {
  const { t, i18n } = useTranslation();
  const { canvas, colors } = useLoginTheme();
  const showToast = useToastStore((s) => s.showToast);
  const [view, setView] = useState<CalendarView>('day');
  const [filter, setFilter] = useState<CalendarFilter>('all');
  const [selectedKey, setSelectedKey] = useState(() => localDateKey());
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [activeSlot, setActiveSlot] = useState<CalendarSlot | null>(null);

  const { model, doctor, patients, finance, isLoading, isError, refetch } = useDoctorCalendar(
    selectedKey,
    filter,
  );

  const dateLabel = formatScheduleDate(dateFromKey(model.selectedKey), i18n.language);
  const monthTitle = formatMonthTitle(dateFromKey(model.selectedKey), i18n.language);
  const hasAppointments = model.dayAppointments.some((a) => a.status !== 'cancelled');
  const firstFree = model.timeline.find((slot) => slot.kind === 'free') ?? null;
  const activePatient = patientForAppointment(activeSlot?.appointment, patients);
  const activeFinance = financeForPatient(
    activeSlot?.appointment?.patientName,
    finance,
    doctor?.fullName,
  );

  const selectedWeekAppointments = useMemo(
    () => model.dayAppointments.filter((a) => a.status !== 'cancelled'),
    [model.dayAppointments],
  );

  const openSlotById = (id: string) => {
    const fromTimeline = model.timeline.find((slot) => slot.appointment?.id === id);
    if (fromTimeline) {
      setActiveSlot(fromTimeline);
      return;
    }
    const apt = model.weekDays.flatMap((d) => d.appointments).find((a) => a.id === id);
    if (!apt) return;
    setActiveSlot({
      id: apt.id,
      start: apt.time,
      end: apt.time,
      startMinutes: 0,
      durationMinutes: 30,
      kind: apt.status === 'completed' ? 'completed' : apt.notes ? 'confirmed' : 'pending',
      appointment: apt,
    });
  };

  const handleFilter = (next: CalendarFilter) => {
    if (next === 'today') {
      setSelectedKey(model.todayKey);
      setFilter('all');
      setView('day');
      return;
    }
    setFilter(next);
  };

  const handleAdd = (slot?: CalendarSlot | null) => {
    const target = slot ?? firstFree;
    showToast({
      tone: 'info',
      title: t('doctor_app.add_appointment_cta'),
      message: target
        ? t('doctor_app.add_slot_hint', { time: `${target.start} – ${target.end}` })
        : t('doctor_app.add_slot_empty'),
    });
  };

  const handleCancel = async () => {
    const id = activeSlot?.appointment?.id;
    if (!id) return;
    try {
      await cancelAppointment(id);
      setActiveSlot(null);
      refetch();
      showToast({
        tone: 'success',
        title: t('appointments.cancel_appointment'),
        message: t('doctor_app.cancelled_done'),
      });
    } catch {
      showToast({
        tone: 'error',
        title: t('common.error'),
        message: t('error.something_wrong'),
      });
    }
  };

  const handleStart = async () => {
    const apt = activeSlot?.appointment;
    if (!apt) return;
    try {
      await updateAppointmentStatus(apt.id, 'IN_PROGRESS');
      refetch();
      setActiveSlot(null);
      if (apt.patientId) router.push(`/(doctor)/patient/${apt.patientId}`);
    } catch {
      showToast({
        tone: 'error',
        title: t('common.error'),
        message: t('error.something_wrong'),
      });
    }
  };

  const handleComplete = async () => {
    const apt = activeSlot?.appointment;
    if (!apt) return;
    try {
      const updated = await updateAppointmentStatus(apt.id, 'COMPLETED');
      // Optional: record full payment immediately if doctor chooses pay-on-complete later.
      // Charge is created unpaid by backend; do not auto-create PAID payment.
      setActiveSlot(null);
      refetch();
      showToast({
        tone: 'success',
        title: t('appointments.status_completed'),
        message: updated.charge
          ? t('doctor_app.charge_created', {
              amount: updated.charge.remainingAmount,
              defaultValue: `Charge: ${updated.charge.remainingAmount} UZS unpaid`,
            })
          : t('doctor_app.completed_done', {
              defaultValue: 'Visit completed',
            }),
      });
    } catch {
      showToast({
        tone: 'error',
        title: t('common.error'),
        message: t('error.something_wrong'),
      });
    }
  };

  const handlePayCharge = async () => {
    const apt = activeSlot?.appointment;
    const charge = apt?.charge;
    if (!apt || !charge || charge.remainingAmount <= 0) return;
    try {
      await createFinanceRecord({
        type: 'income',
        amount: charge.remainingAmount,
        serviceName: apt.serviceName,
        patientName: apt.patientName,
        patientId: apt.patientId,
        doctorId: apt.doctorId,
        doctorName: apt.doctorName,
        appointmentId: apt.id,
        chargeId: charge.id,
        paymentMethod: 'cash',
        paymentStatus: 'paid',
      });
      setActiveSlot(null);
      refetch();
      showToast({
        tone: 'success',
        title: t('doctor_finance.paid'),
        message: t('doctor_app.payment_recorded', {
          defaultValue: 'Payment recorded',
        }),
      });
    } catch {
      showToast({
        tone: 'error',
        title: t('common.error'),
        message: t('error.something_wrong'),
      });
    }
  };

  if (isLoading) return <CalendarSkeleton />;
  if (isError) {
    return (
      <ErrorState
        title={t('error.something_wrong')}
        onRetry={refetch}
        retryLabel={t('common.retry')}
      />
    );
  }

  return (
    <MobileScreen
      style={{ backgroundColor: canvas }}
      contentStyle={{ gap: 16, paddingTop: 8 }}
      onRefresh={refetch}
    >
      <CalendarHeader
        subtitle={dateLabel}
        onFilter={() => setFiltersOpen((v) => !v)}
        onAdd={() => handleAdd(firstFree)}
      />

      <CalendarViewSwitcher
        value={view}
        onChange={(next) => {
          setView(next);
        }}
      />

      {view !== 'month' ? (
        <DateStrip
          items={model.dateStrip}
          onSelect={(key) => {
            setSelectedKey(key);
            if (filter === 'today') setFilter('all');
          }}
        />
      ) : null}

      {filtersOpen ? (
        <CalendarFilters
          value={selectedKey === model.todayKey && filter === 'all' ? 'today' : filter}
          onChange={handleFilter}
        />
      ) : null}

      {view === 'day' ? (
        <Animated.View key={`day-${model.selectedKey}-${filter}`} entering={FadeIn.duration(220)} style={{ gap: 16 }}>
          <WorkingHoursSummary summary={model.workingHours} isToday={model.isToday} />

          {!hasAppointments ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <Text
                style={{
                  flex: 1,
                  fontFamily: 'GolosText_500Medium',
                  fontSize: 14,
                  lineHeight: 20,
                  color: colors.textSecondary,
                }}
              >
                {t('doctor_app.empty_day_title')}
              </Text>
              <ScalePressable onPress={() => handleAdd(firstFree)}>
                <Text
                  style={{
                    fontFamily: 'GolosText_600SemiBold',
                    fontSize: 13,
                    lineHeight: 18,
                    color: colors.primary,
                  }}
                >
                  {t('doctor_app.add_appointment_cta')}
                </Text>
              </ScalePressable>
            </View>
          ) : null}

          {model.visibleTimeline.length === 0 && filter !== 'all' && filter !== 'today' ? (
            <Text
              style={{
                fontFamily: 'GolosText_400Regular',
                fontSize: 14,
                lineHeight: 20,
                color: colors.textMuted,
                paddingVertical: 12,
              }}
            >
              {t('doctor_app.filter_empty')}
            </Text>
          ) : (
            <DayTimeline
              slots={filter === 'all' || filter === 'today' ? model.timeline : model.visibleTimeline}
              workStartMinutes={model.workStartMinutes}
              workEndMinutes={model.workEndMinutes}
              nowMinutes={model.nowMinutes}
              showNow={model.isToday}
              onAppointment={setActiveSlot}
              onAddFree={handleAdd}
            />
          )}
        </Animated.View>
      ) : null}

      {view === 'week' ? (
        <WeekAgenda
          days={model.weekDays}
          nowMinutes={model.nowMinutes}
          todayKey={model.todayKey}
          onSelectDay={(key) => {
            setSelectedKey(key);
            setView('day');
          }}
          onOpenAppointment={openSlotById}
        />
      ) : null}

      {view === 'month' ? (
        <MonthGrid
          title={monthTitle}
          cells={model.monthCells}
          selectedAppointments={selectedWeekAppointments}
          onSelectDay={setSelectedKey}
          onOpenDay={() => setView('day')}
          onAppointment={openSlotById}
        />
      ) : null}

      <AppointmentDetailSheet
        slot={activeSlot}
        patient={activePatient}
        finance={activeFinance}
        dateLabel={dateLabel}
        onClose={() => setActiveSlot(null)}
        onPatient={() => {
          const id = activeSlot?.appointment?.patientId;
          setActiveSlot(null);
          if (id) router.push(`/(doctor)/patient/${id}`);
        }}
        onEdit={() => {
          setActiveSlot(null);
          showToast({
            tone: 'info',
            title: t('doctor_app.edit_appointment'),
            message: t('doctor_app.edit_hint'),
          });
        }}
        onCancel={() => {
          void handleCancel();
        }}
        onStart={() => {
          void handleStart();
        }}
        onComplete={() => {
          void handleComplete();
        }}
        onPay={() => {
          void handlePayCharge();
        }}
      />
    </MobileScreen>
  );
}
