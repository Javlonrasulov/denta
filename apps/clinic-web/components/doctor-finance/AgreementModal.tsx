'use client';

import { FileSignature, History } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { AuthButton } from '@/components/auth/AuthFields';
import { FormError, ModalBody, ModalFooter, ModalIcon, ModalShell } from '@/components/users/ModalShell';
import { doctorFinanceApi, type DoctorFinanceDetail } from '@/lib/api/clinic-api';
import { readPersistedSession } from '@/lib/auth/session';
import {
  agreementBodyFromForm,
  emptyAgreementForm,
  financeErrorText,
  formFieldFromApi,
  formFromAgreement,
  validateAgreementForm,
  type AgreementErrors,
  type AgreementForm as Form,
} from '@/lib/doctor-finance';
import { useCrmI18n } from '@/lib/i18n/useCrmI18n';

import { AgreementForm } from './AgreementForm';

/** Creates the first agreement or a new version; the previous version is kept in history. */
export function AgreementModal({
  open,
  onClose,
  detail,
  workingDays,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  detail: DoctorFinanceDetail;
  workingDays?: number[];
  onSaved: (next: DoctorFinanceDetail) => void;
}) {
  const { t } = useCrmI18n();
  const p = 'crm.doctor_finance.agreement_modal';
  const current = detail.agreement;
  const [form, setForm] = useState<Form>(() => emptyAgreementForm(detail.today));
  const [errors, setErrors] = useState<AgreementErrors>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [wasOpen, setWasOpen] = useState(false);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setForm(current ? formFromAgreement(current, detail.today) : emptyAgreementForm(detail.today));
      setErrors({});
      setError('');
    }
  }

  const patch = (next: Partial<Form>) => {
    setForm((f) => ({ ...f, ...next }));
    setErrors((prev) => {
      const out = { ...prev };
      for (const key of Object.keys(next)) delete out[key as keyof AgreementErrors];
      return out;
    });
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validateAgreementForm(form, detail.today, current?.effectiveFrom);
    setErrors(errs);
    if (Object.keys(errs).length) {
      setError(t('crm.doctor_finance.errors.fix_form'));
      return;
    }
    const token = readPersistedSession()?.accessToken;
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      onSaved(
        await doctorFinanceApi.saveAgreement(token, detail.doctor.doctorId, agreementBodyFromForm(form)),
      );
      onClose();
    } catch (err) {
      const { code, details } = err as { code?: string; details?: { field?: string } };
      if (code === 'VALIDATION_ERROR') {
        const field = formFieldFromApi(details?.field);
        if (field) setErrors((prev) => ({ ...prev, [field]: 'server' }));
      }
      setError(financeErrorText(t, err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      closeLabel={t('crm.doctor_finance.close')}
      icon={
        <ModalIcon>
          <FileSignature className="h-5 w-5" />
        </ModalIcon>
      }
      title={t(current ? `${p}.title_edit` : `${p}.title_new`)}
      subtitle={detail.doctor.name}
    >
      <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <ModalBody>
          {current ? (
            <div className="flex items-start gap-2.5 rounded-xl bg-amber-50/80 p-3 text-xs leading-relaxed text-amber-900 ring-1 ring-amber-200">
              <History className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{t(`${p}.version_hint`, { version: current.version + 1 })}</span>
            </div>
          ) : null}
          <AgreementForm
            form={form}
            onChange={patch}
            errors={errors}
            today={detail.today}
            workingDays={workingDays}
            minEffectiveFrom={current?.effectiveFrom}
          />
          {error ? <FormError>{error}</FormError> : null}
        </ModalBody>
        <ModalFooter>
          <AuthButton variant="secondary" onClick={onClose} className="tablet:w-auto tablet:px-5">
            {t('crm.doctor_finance.cancel')}
          </AuthButton>
          <AuthButton type="submit" loading={loading} className="tablet:w-auto tablet:px-6">
            {t(current ? `${p}.submit_edit` : `${p}.submit_new`)}
          </AuthButton>
        </ModalFooter>
      </form>
    </ModalShell>
  );
}
