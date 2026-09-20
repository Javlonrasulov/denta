import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useLoginTheme } from '@/components/auth/loginTheme';
import {
  AddPaymentSheet,
  FinanceEmpty,
  FinanceFilterSheet,
  FinanceHeader,
  FinanceInsightCard,
  FinanceSkeleton,
  FinanceSummaryHero,
  PaymentDetailSheet,
  PeriodSwitcher,
  RevenueChartCard,
  ServicesBreakdown,
  TransactionsList,
} from '@/components/doctor/finance';
import { ErrorState } from '@/components/states/EmptyState';
import { queryKeys, useDoctor, useFinance, usePatients } from '@/hooks/queries';
import {
  createFinanceRecord,
  updateFinanceRecord,
  type CreateFinanceInput,
} from '@/services/financeService';
import { useToastStore } from '@/store/toastStore';
import type { FinanceRecord } from '@/types';
import { DEMO_DOCTOR_ID } from '@/utils/doctorDashboard';
import {
  buildDoctorFinanceModel,
  DEMO_DOCTOR_NAME,
  queryFinance,
  scopeDoctorFinance,
  type FinancePeriod,
  type FinanceStatusFilter,
  type FinanceTypeFilter,
} from '@/utils/doctorFinance';

function currentTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export default function DoctorFinanceScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { canvas } = useLoginTheme();
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.showToast);
  const finance = useFinance();
  const patients = usePatients();
  const doctor = useDoctor(DEMO_DOCTOR_ID);

  const [period, setPeriod] = useState<FinancePeriod>('today');
  const [typeFilter, setTypeFilter] = useState<FinanceTypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<FinanceStatusFilter>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addType, setAddType] = useState<'income' | 'expense'>('income');
  const [selected, setSelected] = useState<FinanceRecord | null>(null);
  const [editing, setEditing] = useState<FinanceRecord | null>(null);

  const scoped = useMemo(
    () =>
      scopeDoctorFinance(
        finance.data ?? [],
        doctor.data?.fullName ?? DEMO_DOCTOR_NAME,
        doctor.data?.id ?? DEMO_DOCTOR_ID,
      ),
    [doctor.data, finance.data],
  );
  const model = useMemo(
    () => buildDoctorFinanceModel(scoped, period),
    [period, scoped],
  );
  const visible = useMemo(
    () => queryFinance(model.transactions, typeFilter, statusFilter),
    [model.transactions, statusFilter, typeFilter],
  );
  const serviceNames = useMemo(() => {
    const fromDoctor = doctor.data?.services.map((service) => service.name) ?? [];
    const fromRecords = model.services.map((item) => item.name);
    return Array.from(new Set([...fromDoctor, ...fromRecords]));
  }, [doctor.data, model.services]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.finance.all });

  const onSave = async (input: CreateFinanceInput, id?: string) => {
    const payload: CreateFinanceInput = {
      ...input,
      time: input.time ?? currentTime(),
      doctorName: input.doctorName ?? doctor.data?.fullName ?? DEMO_DOCTOR_NAME,
      doctorId: input.doctorId ?? doctor.data?.id ?? DEMO_DOCTOR_ID,
    };
    if (id) {
      const updated = await updateFinanceRecord(id, payload);
      setSelected((current) => (current?.id === id ? updated : current));
      showToast({
        tone: 'success',
        title: t('doctor_finance.updated'),
        message: payload.serviceName,
      });
    } else {
      await createFinanceRecord(payload);
      showToast({
        tone: 'success',
        title: t('doctor_finance.added'),
        message: payload.serviceName,
      });
    }
    await invalidate();
  };

  const onConfirm = async () => {
    if (!selected) return;
    const updated = await updateFinanceRecord(selected.id, { paymentStatus: 'paid' });
    setSelected(updated);
    showToast({
      tone: 'success',
      title: t('doctor_finance.confirmed'),
      message: updated.serviceName,
    });
    await invalidate();
  };

  if (finance.isLoading) return <FinanceSkeleton />;
  if (finance.isError) {
    return (
      <ErrorState
        title={t('error.something_wrong')}
        onRetry={() => finance.refetch()}
        retryLabel={t('common.retry')}
      />
    );
  }

  const isFiltered = typeFilter !== 'all' || statusFilter !== 'all';

  return (
    <View style={{ flex: 1, backgroundColor: canvas }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={finance.isFetching && !finance.isLoading}
            onRefresh={() => void finance.refetch()}
            tintColor="#4338CA"
          />
        }
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 8,
          paddingBottom: 40,
          gap: 16,
        }}
      >
        <FinanceHeader
          period={period}
          onFilter={() => setFilterOpen(true)}
          onExport={() =>
            showToast({
              tone: 'success',
              title: t('doctor_finance.exported'),
              message: t('doctor_finance.export_message'),
            })
          }
        />
        <PeriodSwitcher value={period} onChange={setPeriod} />
        <FinanceSummaryHero
          model={model}
          onAddPayment={() => {
            setEditing(null);
            setAddType('income');
            setAddOpen(true);
          }}
          onAddExpense={() => {
            setEditing(null);
            setAddType('expense');
            setAddOpen(true);
          }}
        />
        <RevenueChartCard period={period} points={model.trend} />
        <ServicesBreakdown items={model.services} />
        <FinanceInsightCard insights={model.insights} />
        {visible.length === 0 ? (
          <FinanceEmpty
            period={period}
            filtered={isFiltered}
            onAdd={() => {
              setEditing(null);
              setAddType('income');
              setAddOpen(true);
            }}
          />
        ) : (
          <TransactionsList records={visible} onOpen={setSelected} />
        )}
      </ScrollView>

      <FinanceFilterSheet
        visible={filterOpen}
        type={typeFilter}
        status={statusFilter}
        onClose={() => setFilterOpen(false)}
        onType={setTypeFilter}
        onStatus={setStatusFilter}
      />
      <PaymentDetailSheet
        record={selected}
        onClose={() => setSelected(null)}
        onEdit={() => {
          if (!selected) return;
          setEditing(selected);
          setAddType(selected.type);
          setAddOpen(true);
        }}
        onReceipt={() =>
          showToast({
            tone: 'info',
            title: t('doctor_finance.receipt_ready'),
            message: selected?.serviceName ?? '',
          })
        }
        onConfirm={() => void onConfirm()}
      />
      <AddPaymentSheet
        visible={addOpen}
        initialType={addType}
        record={editing}
        patients={patients.data ?? []}
        services={serviceNames}
        onClose={() => {
          setAddOpen(false);
          setEditing(null);
        }}
        onSave={onSave}
      />
    </View>
  );
}
