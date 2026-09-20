'use client';

import { MOCK_FINANCE } from '@denta/mocks';
import { AppShell } from '@/components/layout/AppShell';
import { Badge, DataTable, KpiCard, Panel } from '@/components/ui/crm';
import { useCrmI18n } from '@/lib/i18n/useCrmI18n';

export default function FinancePage() {
  const { t, money, date, status } = useCrmI18n();
  const income = MOCK_FINANCE.filter((r) => r.type === 'income').reduce(
    (s, r) => s + r.amount,
    0,
  );
  const expense = MOCK_FINANCE.filter((r) => r.type === 'expense').reduce(
    (s, r) => s + r.amount,
    0,
  );

  return (
    <AppShell title={t('crm.finance.title')} subtitle={t('crm.finance.subtitle')}>
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard label={t('crm.finance.income')} value={money(income)} />
          <KpiCard label={t('crm.finance.expenses')} value={money(expense)} />
          <KpiCard label={t('crm.finance.net')} value={money(income - expense)} />
        </div>
        <Panel title={t('crm.finance.transactions')}>
          <DataTable
            columns={[
              t('crm.columns.date'),
              t('crm.columns.patient_vendor'),
              t('crm.columns.doctor'),
              t('crm.columns.service'),
              t('crm.columns.amount'),
              t('crm.columns.status'),
            ]}
            rows={MOCK_FINANCE.map((r) => [
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
        </Panel>
      </div>
    </AppShell>
  );
}
