'use client';

import { BellRing } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';

import { AuthButton } from '@/components/auth/AuthFields';
import {
  FormError,
  ModalBody,
  ModalFooter,
  ModalIcon,
  ModalSection,
  ModalShell,
} from '@/components/users/ModalShell';
import { doctorFinanceApi, type RentReminderSettings } from '@/lib/api/clinic-api';
import { readPersistedSession } from '@/lib/auth/session';
import { financeErrorText } from '@/lib/doctor-finance';
import { useCrmI18n } from '@/lib/i18n/useCrmI18n';

import { FieldLabel, Hint, Segmented, Toggle } from './fields';

export function ReminderSettingsModal({
  open,
  onClose,
  canEdit,
}: {
  open: boolean;
  onClose: () => void;
  canEdit: boolean;
}) {
  const { t } = useCrmI18n();
  const p = 'crm.doctor_finance.reminders';
  const [s, setS] = useState<RentReminderSettings | null>(null);
  const [customDays, setCustomDays] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const token = readPersistedSession()?.accessToken;
    if (!token) return;
    setError('');
    setS(null);
    doctorFinanceApi
      .reminderSettings(token)
      .then((r) => {
        setS(r);
        setCustomDays(r.overdueCustomDays ? String(r.overdueCustomDays) : '');
      })
      .catch((err) => setError(financeErrorText(t, err)));
  }, [open, t]);

  const set = <K extends keyof RentReminderSettings>(key: K, value: RentReminderSettings[K]) =>
    setS((prev) => (prev ? { ...prev, [key]: value } : prev));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!s) return;
    const days = Number(customDays);
    if (s.overdueFrequency === 'CUSTOM' && (!Number.isInteger(days) || days < 1 || days > 60)) {
      setError(t(`${p}.custom_days_error`));
      return;
    }
    const token = readPersistedSession()?.accessToken;
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const { overdueCustomDays: _ignored, ...rest } = s;
      await doctorFinanceApi.updateReminderSettings(token, {
        ...rest,
        ...(s.overdueFrequency === 'CUSTOM' ? { overdueCustomDays: days } : {}),
      });
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
      closeLabel={t('crm.doctor_finance.close')}
      icon={
        <ModalIcon>
          <BellRing className="h-5 w-5" />
        </ModalIcon>
      }
      title={t(`${p}.title`)}
      subtitle={t(`${p}.subtitle`)}
    >
      <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <ModalBody>
          {!s ? (
            error ? <FormError>{error}</FormError> : <p className="text-sm text-slate-400">…</p>
          ) : (
            <fieldset disabled={!canEdit} className="space-y-6 disabled:opacity-70">
              <ModalSection title={t(`${p}.when`)}>
                <div className="grid gap-2 tablet:grid-cols-2">
                  <Toggle checked={s.remind3Days} onChange={(v) => set('remind3Days', v)} label={t(`${p}.d3`)} />
                  <Toggle checked={s.remind1Day} onChange={(v) => set('remind1Day', v)} label={t(`${p}.d1`)} />
                  <Toggle checked={s.remindDueDay} onChange={(v) => set('remindDueDay', v)} label={t(`${p}.due`)} />
                  <Toggle
                    checked={s.remindOverdue}
                    onChange={(v) => set('remindOverdue', v)}
                    label={t(`${p}.overdue`)}
                  />
                </div>
              </ModalSection>

              {s.remindOverdue ? (
                <ModalSection title={t(`${p}.frequency`)}>
                  <Segmented
                    value={s.overdueFrequency}
                    onChange={(v) => set('overdueFrequency', v)}
                    options={[
                      { value: 'DAILY', label: t(`${p}.freq.DAILY`) },
                      { value: 'EVERY_3_DAYS', label: t(`${p}.freq.EVERY_3_DAYS`) },
                      { value: 'WEEKLY', label: t(`${p}.freq.WEEKLY`) },
                      { value: 'CUSTOM', label: t(`${p}.freq.CUSTOM`) },
                    ]}
                  />
                  {s.overdueFrequency === 'CUSTOM' ? (
                    <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                      <span>{t(`${p}.every`)}</span>
                      <input
                        inputMode="numeric"
                        aria-label={`${t(`${p}.every`)} … ${t(`${p}.days`)}`}
                        value={customDays}
                        onChange={(e) => setCustomDays(e.target.value.replace(/\D/g, '').slice(0, 2))}
                        className="h-10 w-16 rounded-lg border border-slate-200 bg-slate-50 px-2 text-center font-semibold tabular-nums outline-none focus:border-primary focus:bg-white"
                      />
                      <span>{t(`${p}.days`)}</span>
                    </div>
                  ) : null}
                </ModalSection>
              ) : null}

              <ModalSection title={t(`${p}.recipients`)}>
                <div className="space-y-2">
                  <Toggle
                    checked={s.notifyDoctor}
                    onChange={(v) => set('notifyDoctor', v)}
                    label={t(`${p}.notify_doctor`)}
                    description={t(`${p}.notify_doctor_hint`)}
                  />
                  <Toggle
                    checked={s.notifyStaff}
                    onChange={(v) => set('notifyStaff', v)}
                    label={t(`${p}.notify_staff`)}
                    description={t(`${p}.notify_staff_hint`)}
                  />
                </div>
              </ModalSection>

              <div>
                <FieldLabel>{t(`${p}.send_hour`)}</FieldLabel>
                <select
                  aria-label={t(`${p}.send_hour`)}
                  value={s.sendHour}
                  onChange={(e) => set('sendHour', Number(e.target.value))}
                  className="mt-1.5 h-11 w-40 rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-sm font-semibold tabular-nums outline-none focus:border-primary focus:bg-white"
                >
                  {Array.from({ length: 24 }, (_, h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
                <Hint>{t(`${p}.send_hour_hint`)}</Hint>
              </div>
            </fieldset>
          )}
          {s && error ? <FormError>{error}</FormError> : null}
        </ModalBody>
        <ModalFooter>
          <AuthButton variant="secondary" onClick={onClose} className="tablet:w-auto tablet:px-5">
            {t('crm.doctor_finance.close')}
          </AuthButton>
          {canEdit ? (
            <AuthButton type="submit" loading={loading} disabled={!s} className="tablet:w-auto tablet:px-6">
              {t(`${p}.save`)}
            </AuthButton>
          ) : null}
        </ModalFooter>
      </form>
    </ModalShell>
  );
}
