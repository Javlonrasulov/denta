'use client';

import { RotateCcw } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { AuthButton } from '@/components/auth/AuthFields';
import { MoneyInput, TextArea } from '@/components/doctor-finance/fields';
import { FormError, ModalBody, ModalFooter, ModalIcon, ModalShell } from '@/components/users/ModalShell';
import { clinicApi, type ClinicFinanceRecord } from '@/lib/api/clinic-api';
import { readPersistedSession } from '@/lib/auth/session';
import { financeErrorText } from '@/lib/doctor-finance';
import { useCrmI18n } from '@/lib/i18n/useCrmI18n';

/** Refund = negative payment linked to the original; the doctor's revenue share is reversed by the API. */
export function RefundPaymentModal({
  record,
  refundedSoFar = 0,
  onClose,
  onDone,
}: {
  record: ClinicFinanceRecord | null;
  /** Sum of earlier refunds visible in the list (positive); the API stays the source of truth. */
  refundedSoFar?: number;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t, money } = useCrmI18n();
  const p = 'crm.doctor_finance.refund';
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [openedFor, setOpenedFor] = useState<string | null>(null);

  if ((record?.id ?? null) !== openedFor) {
    setOpenedFor(record?.id ?? null);
    if (record) {
      const left = record.amount - refundedSoFar;
      setAmount(left > 0 ? String(left) : '');
      setReason('');
      setError('');
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!record) return;
    const value = Number(amount || 0);
    if (value <= 0) return setError(t('crm.doctor_finance.errors.amount'));
    if (reason.trim().length < 3) return setError(t('crm.doctor_finance.errors.reason'));
    const token = readPersistedSession()?.accessToken;
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      await clinicApi.refundPayment(token, record.id, { amount: value, reason: reason.trim() });
      onDone();
      onClose();
    } catch (err) {
      const details = (err as { details?: { refundable?: number } }).details;
      if (details?.refundable !== undefined) {
        setError(t(`${p}.too_much`, { amount: money(details.refundable) }));
        if (details.refundable > 0) setAmount(String(details.refundable));
      } else {
        setError(financeErrorText(t, err));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalShell
      open={Boolean(record)}
      onClose={onClose}
      size="sm"
      closeLabel={t('crm.doctor_finance.close')}
      icon={
        <ModalIcon tone="danger">
          <RotateCcw className="h-5 w-5" />
        </ModalIcon>
      }
      title={t(`${p}.title`)}
      subtitle={record ? [record.patientName, record.serviceName].filter(Boolean).join(' · ') : undefined}
    >
      <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <ModalBody>
          <p className="text-sm leading-relaxed text-slate-600">{t(`${p}.hint`)}</p>
          <MoneyInput label={t(`${p}.amount`)} value={amount} onChange={setAmount} large />
          <TextArea label={t('crm.doctor_finance.reason')} value={reason} onChange={setReason} rows={3} />
          {error ? <FormError>{error}</FormError> : null}
        </ModalBody>
        <ModalFooter>
          <AuthButton variant="secondary" onClick={onClose} className="tablet:w-auto tablet:px-5">
            {t('crm.doctor_finance.cancel')}
          </AuthButton>
          <AuthButton type="submit" variant="danger" loading={loading} className="tablet:w-auto tablet:px-6">
            {t(`${p}.submit`)}
          </AuthButton>
        </ModalFooter>
      </form>
    </ModalShell>
  );
}
