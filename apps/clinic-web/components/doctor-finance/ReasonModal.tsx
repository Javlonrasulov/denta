'use client';

import { AlertTriangle } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';

import { AuthButton } from '@/components/auth/AuthFields';
import { FormError, ModalBody, ModalFooter, ModalIcon, ModalShell } from '@/components/users/ModalShell';
import { financeErrorText } from '@/lib/doctor-finance';
import { useCrmI18n } from '@/lib/i18n/useCrmI18n';

import { TextArea } from './fields';

/** Asks for a mandatory reason before a void / cancel / reject (kept in the audit log). */
export function ReasonModal({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const { t } = useCrmI18n();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setReason('');
      setError('');
    }
  }, [open]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (reason.trim().length < 3) {
      setError(t('crm.doctor_finance.errors.reason'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onConfirm(reason.trim());
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
        <ModalIcon tone="danger">
          <AlertTriangle className="h-5 w-5" />
        </ModalIcon>
      }
      title={title}
    >
      <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <ModalBody>
          <p className="text-sm leading-relaxed text-slate-600">{description}</p>
          <TextArea
            label={t('crm.doctor_finance.reason')}
            value={reason}
            onChange={setReason}
            placeholder={t('crm.doctor_finance.reason_placeholder')}
            rows={3}
          />
          {error ? <FormError>{error}</FormError> : null}
        </ModalBody>
        <ModalFooter>
          <AuthButton variant="secondary" onClick={onClose} className="tablet:w-auto tablet:px-5">
            {t('crm.doctor_finance.cancel')}
          </AuthButton>
          <AuthButton type="submit" variant="danger" loading={loading} className="tablet:w-auto tablet:px-6">
            {confirmLabel}
          </AuthButton>
        </ModalFooter>
      </form>
    </ModalShell>
  );
}
