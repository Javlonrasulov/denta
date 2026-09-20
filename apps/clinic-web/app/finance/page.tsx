'use client';

import { useMemo, useState } from 'react';

import { CrmQueryState } from '@/components/crm/CrmQueryState';
import { AppShell } from '@/components/layout/AppShell';
import { Badge, DataTable, KpiCard, Panel } from '@/components/ui/crm';
import { clinicApi } from '@/lib/api/clinic-api';
import { useClinicQuery } from '@/lib/api/useClinicData';
import { readPersistedSession } from '@/lib/auth/session';
import { useCrmI18n } from '@/lib/i18n/useCrmI18n';

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
              <p className="text-sm text-slate-500">{t('crm.patient_flow.empty_title')}</p>
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
              <p className="text-sm text-slate-500">{t('crm.patient_flow.empty_title')}</p>
            ) : (
              <DataTable
                columns={[
                  t('crm.columns.date'),
                  t('crm.columns.patient_vendor'),
                  t('crm.columns.doctor'),
                  t('crm.columns.service'),
                  t('crm.columns.amount'),
                  t('crm.columns.status'),
                ]}
                rows={(transactionsQuery.data ?? []).map((r) => [
                  date(r.date),
                  r.patientName ?? '—',
                  r.doctorName ?? '—',
                  r.serviceName,
                  <span
                    key="a"
                    className={r.type === 'expense' ? 'font-medium text-rose-600' : 'font-medium'}
                  >
                    {r.type === 'expense' ? '−' : '+'}
                    {money(r.amount)}
                  </span>,
                  <Badge key="s" status={r.paymentStatus}>
                    {status(r.paymentStatus)}
                  </Badge>,
                ])}
              />
            )}
          </Panel>
        </div>
      </CrmQueryState>
    </AppShell>
  );
}
