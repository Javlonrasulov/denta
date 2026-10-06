'use client';

import { CircleDollarSign } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';

import { AuthButton } from '@/components/auth/AuthFields';
import { DatePicker } from '@/components/ui/DatePicker';
import { FormError, ModalBody, ModalFooter, ModalIcon, ModalShell } from '@/components/users/ModalShell';
import { doctorFinanceApi, type DoctorFinanceDetail } from '@/lib/api/clinic-api';
import { readPersistedSession } from '@/lib/auth/session';
import { financeErrorText, MAX_UZS } from '@/lib/doctor-finance';
import { useCrmI18n } from '@/lib/i18n/useCrmI18n';

import { MoneyInput, TextArea } from './fields';

export function OpeningBalanceModal({
  open,
  onClose,
  detail,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  detail: DoctorFinanceDetail;
  onSaved: (next: DoctorFinanceDetail) => void;
}) {
  const { t } = useCrmI18n();
  const p = 'crm.doctor_finance.opening';
  const [amount, setAmount] = useState('');
  const [asOf, setAsOf] = useState(detail.today);
  const [note, setNote] = useState('');
  const [amountError, setAmountError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAmount('');
    setAsOf(detail.today);
    setNote('');
    setAmountError('');
    setError('');
  }, [open, detail.today]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const value = Number(amount || 0);
    if (value <= 0) return setAmountError(t('crm.doctor_finance.errors.amount'));
    if (value > MAX_UZS) return setAmountError(t('crm.doctor_finance.errors.amount_max'));
    const token = readPersistedSession()?.accessToken;
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      onSaved(
        await doctorFinanceApi.openingBalance(token, detail.doctor.doctorId, {
          amountUzs: value,
          asOf,
          note: note.trim() || undefined,
        }),
      );
      onClose();
    } catch (err) {
      setError(financeErrorText(t, err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      size="sm"
      closeLabel={t('crm.doctor_finance.close')}
      icon={
        <ModalIcon>
          <CircleDollarSign className="h-5 w-5" />
        </ModalIcon>
      }
      title={t(`${p}.title`)}
      subtitle={detail.doctor.name}
    >
      <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <ModalBody>
          <p className="text-sm leading-relaxed text-slate-600">{t(`${p}.hint`)}</p>
          <MoneyInput
            label={t(`${p}.amount`)}
            value={amount}
            onChange={(v) => {
              setAmount(v);
              setAmountError('');
            }}
            error={amountError}
            large
            autoFocus
          />
          <DatePicker label={t(`${p}.as_of`)} value={asOf} max={detail.today} onChange={setAsOf} />
          <TextArea label={t(`${p}.note`)} value={note} onChange={setNote} />
          {error ? <FormError>{error}</FormError> : null}
        </ModalBody>
        <ModalFooter>
          <AuthButton variant="secondary" onClick={onClose} className="tablet:w-auto tablet:px-5">
            {t('crm.doctor_finance.cancel')}
          </AuthButton>
          <AuthButton type="submit" loading={loading} className="tablet:w-auto tablet:px-6">
            {t(`${p}.submit`)}
          </AuthButton>
        </ModalFooter>
      </form>
    </ModalShell>
  );
}
