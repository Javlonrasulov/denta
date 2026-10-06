'use client';

import { FileText, Paperclip, ReceiptText, X } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';

import { AuthButton } from '@/components/auth/AuthFields';
import { DatePicker } from '@/components/ui/DatePicker';
import {
  FormError,
  ModalBody,
  ModalFooter,
  ModalIcon,
  ModalSection,
  ModalShell,
} from '@/components/users/ModalShell';
import {
  doctorFinanceApi,
  type DoctorFinanceDetail,
  type RentPaymentMethod,
} from '@/lib/api/clinic-api';
import { readPersistedSession } from '@/lib/auth/session';
import { financeErrorText, groupDigits, MAX_UZS } from '@/lib/doctor-finance';
import { useCrmI18n } from '@/lib/i18n/useCrmI18n';

import { MethodPicker } from './AgreementForm';
import { MoneyInput, TextArea } from './fields';

const RECEIPT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const RECEIPT_MAX_BYTES = 5 * 1024 * 1024;

export function RentPaymentModal({
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
  const { t, money, date } = useCrmI18n();
  const p = 'crm.doctor_finance.payment';
  const [amount, setAmount] = useState('');
  const [paidAt, setPaidAt] = useState(detail.today);
  const [method, setMethod] = useState<RentPaymentMethod>('cash');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  /** Reused on retry so a failed payment doesn't upload the same receipt again. */
  const [uploaded, setUploaded] = useState<{ file: File; url: string } | null>(null);
  const [amountError, setAmountError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const debt = detail.summary.totalDebtUzs;
  const suggested = debt > 0 ? debt : (detail.summary.nextDue?.amountUzs ?? 0);

  const [wasOpen, setWasOpen] = useState(false);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setAmount(suggested > 0 ? String(suggested) : '');
      setPaidAt(detail.today);
      setMethod('cash');
      setNote('');
      setFile(null);
      setUploaded(null);
      setAmountError('');
      setError('');
    }
  }

  const value = Number(amount || 0);
  const openTotal = detail.summary.totalDebtUzs + detail.summary.upcomingUzs;
  const advance = value > openTotal ? value - openTotal : 0;

  function pickFile(f: File | undefined) {
    if (!f) return;
    if (!RECEIPT_TYPES.includes(f.type)) {
      setError(t(`${p}.receipt_type`));
      return;
    }
    if (f.size > RECEIPT_MAX_BYTES) {
      setError(t(`${p}.receipt_size`));
      return;
    }
    setError('');
    setFile(f);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (value <= 0) return setAmountError(t('crm.doctor_finance.errors.amount'));
    if (value > MAX_UZS) return setAmountError(t('crm.doctor_finance.errors.amount_max'));
    const token = readPersistedSession()?.accessToken;
    if (!token) return;
    setLoading(true);
    try {
      let attachmentUrl: string | undefined;
      if (file) {
        attachmentUrl =
          uploaded?.file === file ? uploaded.url : (await doctorFinanceApi.uploadReceipt(token, file)).url;
        setUploaded({ file, url: attachmentUrl });
      }
      const next = await doctorFinanceApi.recordPayment(token, detail.doctor.doctorId, {
        amountUzs: value,
        paidAt,
        method,
        note: note.trim() || undefined,
        attachmentUrl,
      });
      onSaved(next);
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
          <ReceiptText className="h-5 w-5" />
        </ModalIcon>
      }
      title={t(`${p}.title`)}
      subtitle={detail.doctor.name}
    >
      <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <ModalBody>
          <div className="grid grid-cols-3 gap-2 text-center">
            <MiniStat
              label={t('crm.doctor_finance.kpi.debt')}
              value={money(debt)}
              tone={debt > 0 ? 'text-rose-600' : undefined}
            />
            <MiniStat
              label={t('crm.doctor_finance.kpi.next_due')}
              value={detail.summary.nextDue ? money(detail.summary.nextDue.amountUzs) : '—'}
              sub={detail.summary.nextDue ? date(detail.summary.nextDue.date) : undefined}
            />
            <MiniStat
              label={t('crm.doctor_finance.kpi.advance')}
              value={money(detail.summary.advanceUzs)}
              tone={detail.summary.advanceUzs > 0 ? 'text-emerald-600' : undefined}
            />
          </div>

          <MoneyInput
            label={t(`${p}.amount`)}
            value={amount}
            onChange={(v) => {
              setAmount(v);
              setAmountError('');
            }}
            error={amountError}
            hint={
              advance > 0
                ? t(`${p}.advance_hint`, { amount: money(advance) })
                : t(`${p}.fifo_hint`)
            }
            large
            autoFocus
          />

          <ModalSection title={t(`${p}.details`)}>
            <div className="space-y-3">
              <DatePicker
                label={t(`${p}.paid_at`)}
                value={paidAt}
                max={detail.today}
                onChange={setPaidAt}
              />
              <MethodPicker value={method} onChange={setMethod} />
              <TextArea
                label={t(`${p}.note`)}
                value={note}
                onChange={setNote}
                placeholder={t(`${p}.note_placeholder`)}
              />
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept={RECEIPT_TYPES.join(',')}
                  className="hidden"
                  onChange={(e) => {
                    pickFile(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
                {file ? (
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5">
                    <FileText className="h-4 w-4 shrink-0 text-primary" />
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      aria-label={t('crm.doctor_finance.remove')}
                      className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-slate-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-3.5 py-3 text-sm font-medium text-slate-500 transition hover:border-primary hover:bg-primary-muted/30 hover:text-primary"
                  >
                    <Paperclip className="h-4 w-4" />
                    {t(`${p}.receipt`)}
                  </button>
                )}
              </div>
            </div>
          </ModalSection>
          {error ? <FormError>{error}</FormError> : null}
        </ModalBody>
        <ModalFooter>
          <AuthButton variant="secondary" onClick={onClose} className="tablet:w-auto tablet:px-5">
            {t('crm.doctor_finance.cancel')}
          </AuthButton>
          <AuthButton type="submit" loading={loading} className="tablet:w-auto tablet:px-6">
            {t(`${p}.submit`)}
            {value > 0 ? (
              <span className="rounded-md bg-frost/ px-1.5 py-0.5 tabular-nums">
                {groupDigits(value)} {t('crm.doctor_finance.currency')}
              </span>
            ) : null}
          </AuthButton>
        </ModalFooter>
      </form>
    </ModalShell>
  );
}

function MiniStat({
  label,
  value,
  sub,
  tone = 'text-slate-900',
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-2 py-2.5">
      <p className="truncate text-[11px] font-medium text-slate-500">{label}</p>
      <p className={`mt-0.5 truncate text-sm font-semibold tabular-nums ${tone}`}>{value}</p>
      {sub ? <p className="truncate text-[11px] text-slate-400">{sub}</p> : null}
    </div>
  );
}
