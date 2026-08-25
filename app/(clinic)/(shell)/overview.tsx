import { useMemo, useState } from 'react';
import { View } from 'react-native';
import {
  CalendarPlus,
  Percent,
  UserPlus,
  Users,
  Wallet,
  Stethoscope,
  Receipt,
} from '@/components/icons';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';

import { AppShell } from '@/components/layout/AppShell';
import {
  DonutChartCard,
  KpiStat,
  LineChartCard,
  QuickActions,
  Section,
  StatusDot,
  Timeline,
  DataTable,
  type TimelineItem,
} from '@/components/crm';
import { Avatar } from '@/components/ui/Avatar';
import { Text } from '@/components/ui/Text';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { useAppointments, useClinicStats, useDoctors, usePatients } from '@/hooks/queries';
import { MOCK_ROOMS } from '@/mocks/data';
import { useTheme } from '@/theme';
import { formatPrice } from '@/utils/slots';

export default function ClinicOverviewScreen() {
  const { t } = useTranslation();
  const { colors, spacing, radius, isDesktop } = useTheme();
  const [range, setRange] = useState<'7d' | '30d' | '12m'>('7d');
  const stats = useClinicStats();
  const appointments = useAppointments();
  const doctors = useDoctors();
  const patients = usePatients();

  const todayApts = useMemo((): TimelineItem[] => {
    const list = (appointments.data ?? [])
      .filter((a) => a.date === '2026-08-23')
      .sort((a, b) => a.time.localeCompare(b.time));
    const items: TimelineItem[] = list.map((a) => ({
      id: a.id,
      time: a.time,
      title: a.patientName,
      subtitle: a.serviceName,
      meta: `${a.doctorName}`,
      status:
        a.status === 'upcoming'
          ? t('appointments.status_upcoming')
          : a.status === 'completed'
            ? t('appointments.status_completed')
            : t('appointments.status_cancelled'),
      statusTone:
        a.status === 'upcoming'
          ? 'primary'
          : a.status === 'completed'
            ? 'success'
            : 'error',
    }));
    if (items.length > 0) {
      items.splice(Math.min(2, items.length), 0, {
        id: 'avail-1',
        time: '11:00',
        title: t('crm.dashboard.available_slot'),
        available: true,
      });
    }
    return items;
  }, [appointments.data, t]);

  const topDoctors = useMemo(() => {
    return [...(doctors.data ?? [])]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 4);
  }, [doctors.data]);

  const recentPatients = useMemo(() => (patients.data ?? []).slice(0, 6), [patients.data]);

  const occupancy = stats.data
    ? Math.round(
        ((MOCK_ROOMS.length - (stats.data.availableRooms ?? 0)) / Math.max(MOCK_ROOMS.length, 1)) * 100,
      )
    : 0;

  if (stats.isLoading) {
    return (
      <AppShell title={t('crm.dashboard.title')} subtitle={t('crm.dashboard.subtitle')}>
        <ListSkeleton rows={8} />
      </AppShell>
    );
  }

  return (
    <AppShell title={t('crm.dashboard.title')} subtitle={t('crm.dashboard.subtitle')}>
      <View style={{ gap: spacing.xl }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.lg }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="display" style={{ fontSize: 28, lineHeight: 34 }}>
              {t('crm.dashboard.greeting')}
            </Text>
            <Text variant="body" color={colors.textSecondary}>
              {t('crm.dashboard.intro')}
            </Text>
          </View>
          <View
            style={{
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: radius.full,
              backgroundColor: colors.primaryMuted,
            }}
          >
            <Text variant="caption" color={colors.primary} weight="semibold">
              {t('common.today')}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
          <KpiStat
            label={t('crm.dashboard.revenue')}
            value={`${formatPrice(stats.data?.revenue ?? 5_000_000)}`}
            trend="+12.4%"
            trendUp
            comparison={t('common.vs_yesterday')}
            icon={Wallet}
          />
          <KpiStat
            label={t('crm.dashboard.appointments')}
            value={String(stats.data?.appointments ?? 20)}
            comparison={t('crm.dashboard.completed_of', { count: 16 })}
            icon={CalendarPlus}
          />
          <KpiStat
            label={t('crm.dashboard.new_patients')}
            value={String(stats.data?.patients ?? 13)}
            trend="+4"
            trendUp
            comparison={t('common.this_week')}
            icon={Users}
          />
          <KpiStat
            label={t('crm.dashboard.occupancy')}
            value={`${occupancy}%`}
            comparison={t('crm.dashboard.rooms_available', { count: stats.data?.availableRooms ?? 2 })}
            icon={Percent}
          />
        </View>

        <QuickActions
          actions={[
            { id: 'apt', label: t('crm.dashboard.new_appointment'), icon: CalendarPlus, onPress: () => router.push('/(clinic)/(shell)/appointments') },
            { id: 'pat', label: t('crm.dashboard.add_patient'), icon: UserPlus, onPress: () => router.push('/(clinic)/(shell)/patients') },
            { id: 'doc', label: t('crm.dashboard.add_doctor'), icon: Stethoscope, onPress: () => router.push('/(clinic)/(shell)/doctors') },
            { id: 'exp', label: t('crm.dashboard.add_expense'), icon: Receipt, onPress: () => router.push('/(clinic)/(shell)/finance') },
          ]}
        />

        <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: spacing.lg }}>
          <View style={{ flex: 1.1 }}>
            <Section title={t('crm.dashboard.todays_schedule')}>
              <Timeline
                items={todayApts}
                onPressItem={(item) => {
                  if (!item.available) router.push(`/(client)/appointment/${item.id}`);
                }}
              />
            </Section>
          </View>
          <View style={{ flex: 1, gap: spacing.lg }}>
            <Section title={t('crm.dashboard.revenue_analytics')}>
              <LineChartCard
                title=""
                totalValue={`${formatPrice(35_400_000)}`}
                totalLabel={t('crm.dashboard.week_total')}
                range={range}
                onRangeChange={setRange}
                rangeLabels={[
                  { value: '7d', label: t('crm.dashboard.range_7d') },
                  { value: '30d', label: t('crm.dashboard.range_30d') },
                  { value: '12m', label: t('crm.dashboard.range_12m') },
                ]}
                points={range === '7d' ? [42, 55, 48, 62, 70, 58, 75] : range === '30d' ? [40, 44, 50, 48, 55, 60, 58, 62, 70, 68] : [30, 35, 40, 48, 55, 60, 70, 68, 72, 80, 78, 85]}
              />
            </Section>
            <Section title={t('clinic_crm.appointments_chart')}>
              <DonutChartCard
                title=""
                centerValue="140"
                centerLabel={t('tabs.appointments')}
                segments={[
                  { label: t('appointments.status_upcoming'), value: 64, color: colors.success },
                  { label: t('finance.pending'), value: 18, color: colors.warning },
                  { label: t('appointments.status_cancelled'), value: 11, color: colors.error },
                  { label: t('appointments.status_completed'), value: 7, color: colors.chartTertiary },
                ]}
              />
            </Section>
          </View>
        </View>

        <Section title={t('crm.dashboard.rooms')}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {MOCK_ROOMS.map((room) => (
              <View
                key={room.id}
                style={{
                  width: isDesktop ? '18%' : '47%',
                  minWidth: 140,
                  flexGrow: 1,
                  padding: spacing.md,
                  borderRadius: radius.md,
                  backgroundColor: colors.surfaceSoft,
                  gap: 6,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <StatusDot
                    tone={
                      room.status === 'available'
                        ? 'success'
                        : room.status === 'occupied'
                          ? 'warning'
                          : 'neutral'
                    }
                  />
                  <Text variant="label" style={{ fontSize: 12 }}>
                    {room.number}
                  </Text>
                </View>
                <Text variant="caption" numberOfLines={1}>
                  {room.name}
                </Text>
                <Text variant="caption" muted numberOfLines={1}>
                  {room.doctorName ?? t(`common.${room.status === 'available' ? 'available' : room.status === 'occupied' ? 'occupied' : 'maintenance'}`)}
                </Text>
              </View>
            ))}
          </View>
        </Section>

        <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: spacing.lg }}>
          <View style={{ flex: 1 }}>
            <Section title={t('crm.dashboard.top_doctors')}>
              <View style={{ gap: spacing.md }}>
                {topDoctors.map((doc) => (
                  <View key={doc.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                    <Avatar uri={doc.photoUrl} name={doc.fullName} size={40} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="label" numberOfLines={1}>
                        {doc.fullName}
                      </Text>
                      <Text variant="caption" muted>
                        {t('crm.dashboard.apts_count', { count: Math.round(doc.reviewCount / 5) })} · {t('crm.dashboard.rating', { value: doc.rating.toFixed(1) })}
                      </Text>
                      <View
                        style={{
                          height: 4,
                          borderRadius: 2,
                          backgroundColor: colors.borderSubtle,
                          marginTop: 4,
                          overflow: 'hidden',
                        }}
                      >
                        <View
                          style={{
                            width: `${Math.min(100, doc.rating * 20)}%`,
                            height: '100%',
                            backgroundColor: colors.primary,
                          }}
                        />
                      </View>
                    </View>
                    <Text variant="caption" weight="semibold" color={colors.primary}>
                      {formatPrice(doc.priceFrom * 20)}
                    </Text>
                  </View>
                ))}
              </View>
            </Section>
          </View>
          <View style={{ flex: 1.2 }}>
            <Section title={t('crm.dashboard.recent_patients')} padded={false}>
              <DataTable
                data={recentPatients}
                keyExtractor={(p) => p.id}
                onRowPress={(p) => router.push(`/(clinic)/patient/${p.id}` as never)}
                columns={[
                  {
                    key: 'name',
                    title: t('crm.patients.patient'),
                    flex: 1.4,
                    render: (p) => (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Avatar name={p.fullName} size={28} />
                        <Text variant="bodySmall" weight="semibold" numberOfLines={1}>
                          {p.fullName}
                        </Text>
                      </View>
                    ),
                  },
                  {
                    key: 'phone',
                    title: t('crm.patients.phone'),
                    render: (p) => (
                      <Text variant="caption" muted>
                        {p.phone}
                      </Text>
                    ),
                  },
                  {
                    key: 'visit',
                    title: t('patients.last_visit'),
                    render: (p) => (
                      <Text variant="caption" muted>
                        {p.lastVisit ?? '—'}
                      </Text>
                    ),
                  },
                  {
                    key: 'status',
                    title: t('crm.patients.status'),
                    render: (p) => (
                      <Text
                        variant="caption"
                        color={p.status === 'active' ? colors.success : colors.textMuted}
                        weight="semibold"
                      >
                        {p.status === 'active' ? t('patients.status_active') : t('patients.status_inactive')}
                      </Text>
                    ),
                  },
                ]}
              />
            </Section>
          </View>
        </View>
      </View>
    </AppShell>
  );
}
