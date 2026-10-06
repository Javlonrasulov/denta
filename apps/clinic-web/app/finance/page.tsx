'use client';

import { Plus, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { CrmQueryState } from '@/components/crm/CrmQueryState';
import { DoctorRentsPanel } from '@/components/doctor-finance/DoctorRentsPanel';
import { AddExpenseModal } from '@/components/finance/AddExpenseModal';
import { expenseCategoryLabel } from '@/components/finance/ExpenseCategoryPicker';
import { RefundPaymentModal } from '@/components/finance/RefundPaymentModal';
import { AppShell } from '@/components/layout/AppShell';
import { Badge, DataTable, KpiCard, Panel } from '@/components/ui/crm';
import { clinicApi, type ClinicFinanceRecord } from '@/lib/api/clinic-api';
import { useClinicQuery } from '@/lib/api/useClinicData';
import { readPersistedSession } from '@/lib/auth/session';
import { useDoctorFinanceAccess } from '@/lib/doctor-finance';
import { useCrmI18n } from '@/lib/i18n/useCrmI18n';

function useCanWriteFinance(): boolean {
  const [can, setCan] = useState(false);
  useEffect(() => {
    const perms = readPersistedSession()?.activeWorkspace?.permissions;
    setCan(!perms || perms.includes('*') || perms.includes('finance:write'));
  }, []);
  return can;
}

export default function FinancePage() {
  const { t, money, date, status } = useCrmI18n();
  const summaryQuery = useClinicQuery('finance-summary', (token) =>
    clinicApi.financeSummary(token, 'month'),
  );
  const transactionsQuery = useClinicQuery('finance', clinicApi.finance);
  const chargesQuery = useClinicQuery('finance-charges', (token) =>
    clinicApi.charges(token),
  );
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [refunding, setRefunding] = useState<ClinicFinanceRecord | null>(null);
  const doctorFinance = useDoctorFinanceAccess();
  const canWrite = useCanWriteFinance();

  const closeExpense = useCallback(() => setExpenseOpen(false), []);
  const onExpenseCreated = useCallback(() => {
    void summaryQuery.refetch();
    void transactionsQuery.refetch();
  }, [summaryQuery, transactionsQuery]);

  const addExpenseButton = (
    <button
      type="button"
      onClick={() => setExpenseOpen(true)}
      className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-indigo-700"
    >
      <Plus className="h-4 w-4" strokeWidth={2.5} />
      {t('crm.finance.expense_modal.add_button')}
    </button>
  );

  const outstandingCharges = useMemo(
    () =>
      (chargesQuery.data ?? []).filter(
        (c) => c.status === 'unpaid' || c.status === 'partially_paid',
      ),
    [chargesQuery.data],
  );

  async function payFull(chargeId: string, amount: number) {
    const token = readPersistedSession()?.accessToken;
    if (!token) return;
    setPayingId(chargeId);
    setPayError(null);
    try {
      await clinicApi.payCharge(token, chargeId, {
        amount,
        method: 'cash',
      });
      await Promise.all([
        summaryQuery.refetch(),
        transactionsQuery.refetch(),
        chargesQuery.refetch(),
      ]);
    } catch (e) {
      setPayError(e instanceof Error ? e.message : 'Payment failed');
    } finally {
      setPayingId(null);
    }
  }

  async function payPartial(chargeId: string, remaining: number) {
    const half = Math.max(1, Math.floor(remaining / 2));
    const token = readPersistedSession()?.accessToken;
    if (!token) return;
    setPayingId(chargeId);
    setPayError(null);
    try {
      await clinicApi.payCharge(token, chargeId, {
        amount: half,
        method: 'cash',
      });
      await Promise.all([
        summaryQuery.refetch(),
        transactionsQuery.refetch(),
        chargesQuery.refetch(),
      ]);
    } catch (e) {
      setPayError(e instanceof Error ? e.message : 'Payment failed');
    } finally {
      setPayingId(null);
    }
  }

  const loading =
    summaryQuery.loading || transactionsQuery.loading || chargesQuery.loading;
  const error =
    summaryQuery.error || transactionsQuery.error || chargesQuery.error;

  return (
    <AppShell title={t('crm.finance.title')} subtitle={t('crm.finance.subtitle')}>
      <CrmQueryState
        apiConfigured={summaryQuery.apiConfigured}
        loading={loading}
        error={error}
      >
        <div className="space-y-6">
          <div className="flex justify-end">{addExpenseButton}</div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label={t('crm.finance.income')}
              value={money(summaryQuery.data?.revenue ?? 0)}
            />
            <KpiCard
              label={t('crm.finance.expenses')}
              value={money(summaryQuery.data?.expenses ?? 0)}
            />
            <KpiCard
              label={t('crm.finance.outstanding')}
              value={money(summaryQuery.data?.outstanding ?? 0)}
            />
            <KpiCard
              label={t('crm.finance.net')}
              value={money(summaryQuery.data?.net ?? 0)}
            />
          </div>

          <Panel title={t('crm.finance.outstanding_charges')}>
            {payError ? <p className="mb-3 text-sm text-rose-600">{payError}</p> : null}
            {outstandingCharges.length === 0 ? (
              <p className="text-sm text-slate-500">{t('crm.finance.empty_charges')}</p>
            ) : (
              <DataTable
                columns={[
                  t('crm.columns.patient_vendor'),
                  t('crm.columns.service'),
                  t('crm.columns.amount'),
                  t('crm.columns.status'),
                  t('crm.finance.actions'),
                ]}
                rows={outstandingCharges.map((c) => [
                  c.patientName ?? '—',
                  c.serviceName ?? '—',
                  <span key="a" className="font-medium">
                    {money(c.remainingAmount)} / {money(c.amount)}
                  </span>,
                  <Badge key="s" status={c.status === 'unpaid' ? 'pending' : 'partial'}>
                    {status(c.status === 'unpaid' ? 'pending' : 'partial')}
                  </Badge>,
                  <div key="act" className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={payingId === c.id}
                      onClick={() => void payPartial(c.id, c.remainingAmount)}
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50"
                    >
                      {t('crm.finance.partial_pay')}
                    </button>
                    <button
                      type="button"
                      disabled={payingId === c.id}
                      onClick={() => void payFull(c.id, c.remainingAmount)}
                      className="rounded-lg bg-primary px-2 py-1 text-xs text-white"
                    >
                      {t('crm.finance.full_pay')}
                    </button>
                  </div>,
                ])}
              />
            )}
          </Panel>

          <Panel title={t('crm.finance.transactions')}>
            {(transactionsQuery.data ?? []).length === 0 ? (
              <p className="text-sm text-slate-500">{t('crm.finance.empty_transactions')}</p>
            ) : (
              <DataTable
                columns={[
                  t('crm.columns.date'),
                  t('crm.columns.patient_vendor'),
                  t('crm.columns.doctor'),
                  t('crm.columns.service'),
                  t('crm.columns.amount'),
                  t('crm.columns.status'),
                  ...(canWrite ? [''] : []),
                ]}
                rows={(transactionsQuery.data ?? []).map((r) => [
                  date(r.date),
                  r.type === 'expense' && r.category ? (
                    <span
                      key="c"
                      className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-600"
                    >
                      {expenseCategoryLabel(t, r.category)}
                    </span>
                  ) : (
                    r.patientName ?? '—'
                  ),
                  r.doctorName ?? '—',
                  r.serviceName ||
                    (r.category ? expenseCategoryLabel(t, r.category) : t('crm.finance.expenses')),
                  <span
                    key="a"
                    className={
                      r.type === 'expense' || r.amount < 0 ? 'font-medium text-rose-600' : 'font-medium'
                    }
                  >
                    {r.type === 'expense' || r.amount < 0 ? '−' : '+'}
                    {money(Math.abs(r.amount))}
                    {r.refundOfId ? (
                      <span className="ml-1.5 rounded bg-rose-50 px-1 py-0.5 text-[10px] font-semibold text-rose-600">
                        {t('crm.doctor_finance.refund.badge')}
                      </span>
                    ) : null}
                  </span>,
                  <Badge key="s" status={r.paymentStatus}>
                    {status(r.paymentStatus)}
                  </Badge>,
                  ...(canWrite
                    ? [
                        r.type === 'income' && r.amount > 0 && r.paymentStatus === 'paid' && !r.refundOfId ? (
                          <button
                            key="rf"
                            type="button"
                            onClick={() => setRefunding(r)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            {t('crm.doctor_finance.refund.action')}
                          </button>
                        ) : (
                          ''
                        ),
                      ]
                    : []),
                ])}
              />
            )}
          </Panel>

          {doctorFinance.read ? <DoctorRentsPanel access={doctorFinance} /> : null}
        </div>
      </CrmQueryState>

      <AddExpenseModal open={expenseOpen} onClose={closeExpense} onCreated={onExpenseCreated} />
      <RefundPaymentModal
        record={refunding}
        refundedSoFar={
          refunding
            ? (transactionsQuery.data ?? [])
                .filter((r) => r.refundOfId === refunding.id && r.paymentStatus === 'paid')
                .reduce((s, r) => s - r.amount, 0)
            : 0
        }
        onClose={() => setRefunding(null)}
        onDone={() => {
          void summaryQuery.refetch();
          void transactionsQuery.refetch();
          void chargesQuery.refetch();
        }}
      />
    </AppShell>
  );
}
