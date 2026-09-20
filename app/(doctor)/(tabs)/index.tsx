import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useLoginTheme } from '@/components/auth/loginTheme';
import {
  AvailableSlot,
  CurrentAppointmentBar,
  DashboardSkeleton,
  DoctorAlerts,
  DoctorDashboardHeader,
  DoctorNotificationsSheet,
  DoctorQuickActions,
  NextAppointmentHero,
  RevenueWidget,
  TodayProgress,
  TodayTimeline,
} from '@/components/doctor/dashboard';
import { MobileScreen } from '@/components/mobile';
import { ErrorState } from '@/components/states/EmptyState';
import { useDoctorDashboard } from '@/hooks/useDoctorDashboard';
import { useDoctorProfileStore } from '@/store/doctorProfileStore';
import {
  buildDoctorNotifications,
  doctorGreetingName,
  parseMinutes,
  type DoctorNotification,
} from '@/utils/doctorDashboard';

export default function DoctorDashboardScreen() {
  const { t } = useTranslation();
  const { canvas } = useLoginTheme();
  const { model, doctor, patients, isLoading, isError, refetch } = useDoctorDashboard();
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const avatarOverride = useDoctorProfileStore((s) => s.overrides.avatar);

  const notifications = useMemo(() => {
    return buildDoctorNotifications(model).map((item) => ({
      ...item,
      unread: item.unread && !readIds.includes(item.id),
    }));
  }, [model, readIds]);
  const unreadCount = notifications.filter((item) => item.unread).length;

  const openNotification = (item: DoctorNotification) => {
    setReadIds((prev) => (prev.includes(item.id) ? prev : [...prev, item.id]));
    setNotifyOpen(false);
    if (item.target === 'finance') {
      router.push('/(doctor)/(tabs)/finance');
      return;
    }
    if (item.target === 'calendar') {
      router.push('/(doctor)/(tabs)/calendar');
      return;
    }
    if (item.patientId) {
      router.push(`/(doctor)/patient/${item.patientId}`);
    }
  };

  const openPatient = (patientId?: string) => {
    if (!patientId) return;
    router.push(`/(doctor)/patient/${patientId}`);
  };
  const openCalendar = () => router.push('/(doctor)/(tabs)/calendar');
  const openPatients = () => router.push('/(doctor)/(tabs)/patients');
  const openFinance = () => router.push('/(doctor)/(tabs)/finance');
  const openProfile = () => router.push('/(doctor)/(tabs)/profile');

  if (isLoading) return <DashboardSkeleton />;
  if (isError) {
    return (
      <ErrorState
        title={t('error.something_wrong')}
        onRetry={refetch}
        retryLabel={t('common.retry')}
      />
    );
  }

  const doctorName = doctorGreetingName(doctor?.fullName ?? t('common.app_name'));
  const nextPhone = patients.find((p) => p.id === model.nextAppointment?.patientId)?.phone;
  const workingRange = doctor
    ? `${doctor.workingHours.start} – ${doctor.workingHours.end}`
    : undefined;
  const emptyDay = model.todayAppointments.length === 0;
  const currentElapsed = model.currentAppointment
    ? model.nowMinutes - parseMinutes(model.currentAppointment.time)
    : 0;
  const headerPhoto = avatarOverride === undefined ? doctor?.photoUrl : avatarOverride ?? undefined;

  return (
    <MobileScreen
      style={{ backgroundColor: canvas }}
      contentStyle={{ gap: 22, paddingTop: 8 }}
      onRefresh={refetch}
    >
      <DoctorDashboardHeader
        doctorName={doctorName}
        photoUrl={headerPhoto}
        alertCount={unreadCount}
        onNotify={() => setNotifyOpen(true)}
        onProfile={openProfile}
      />

      {model.currentAppointment ? (
        <CurrentAppointmentBar
          appointment={model.currentAppointment}
          doctor={doctor}
          elapsedMinutes={currentElapsed}
          onPatient={() => openPatient(model.currentAppointment?.patientId)}
          onOpen={() => openPatient(model.currentAppointment?.patientId)}
        />
      ) : null}

      <NextAppointmentHero
        appointment={model.nextAppointment}
        doctor={doctor}
        room={model.room}
        nowMinutes={model.nowMinutes}
        workingRange={workingRange}
        phone={nextPhone}
        onPatient={() => openPatient(model.nextAppointment?.patientId)}
        onCreate={openCalendar}
      />

      <TodayProgress
        patients={model.patientsToday}
        completed={model.completedAppointments.length}
        remaining={model.remainingAppointments.length}
        total={model.todayAppointments.filter((a) => a.status !== 'cancelled').length}
      />

      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <RevenueWidget amount={model.todayRevenue} deltaPct={model.revenueDeltaPct} />
        <AvailableSlot slot={model.nextAvailableSlot} onPress={openCalendar} />
      </View>

      <DoctorQuickActions
        onPatient={openPatients}
        onAppointment={openCalendar}
        onSlot={openCalendar}
        onFinance={openFinance}
      />

      <TodayTimeline
        items={model.timeline}
        empty={emptyDay}
        onCreate={openCalendar}
        onItemPress={(item) => openPatient(item.appointment?.patientId)}
      />

      <DoctorAlerts alerts={model.alerts} onPress={(alert) => openPatient(alert.patientId)} />

      <DoctorNotificationsSheet
        visible={notifyOpen}
        items={notifications}
        onClose={() => setNotifyOpen(false)}
        onOpen={openNotification}
        onMarkAllRead={() => setReadIds(notifications.map((item) => item.id))}
      />
    </MobileScreen>
  );
}
