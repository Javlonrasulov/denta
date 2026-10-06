'use client';

import {
  ArrowLeftRight,
  Banknote,
  CreditCard,
  ReceiptText,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { AuthButton, AuthField } from '@/components/auth/AuthFields';
import {
  ExpenseCategoryPicker,
  type CategoryValue,
} from '@/components/finance/ExpenseCategoryPicker';
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
  clinicApi,
  type ClinicExpenseCategory,
  type CreateExpenseBody,
} from '@/lib/api/clinic-api';
import { readPersistedSession } from '@/lib/auth/session';
import { cn } from '@/lib/cn';

// Expense.amountUzs is a Postgres int4.
const MAX_AMOUNT = 2_000_000_000;
const QUICK_AMOUNTS = [50_000, 100_000, 500_000, 1_000_000];

type Method = CreateExpenseBody['paymentMethod'];

const METHODS: { id: Method; icon: LucideIcon }[] = [
  { id: 'cash', icon: Banknote },
  { id: 'card', icon: CreditCard },
  { id: 'transfer', icon: ArrowLeftRight },
];

type FormState = {
  amount: string;
  category: CategoryValue | null;
  method: Method;
  date: string;
  name: string;
  notes: string;
};

type FieldErrors = Partial<Record<'amount' | 'category' | 'date', string>>;

function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function groupDigits(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function emptyForm(): FormState {
  return { amount: '', category: null, method: 'cash', date: todayIso(), name: '', notes: '' };
}

export function AddExpenseModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [customCategories, setCustomCategories] = useState<ClinicExpenseCategory[]>([]);
  const amountRef = useRef<HTMLInputElement>(null);
  const amountId = useId();
  const notesId = useId();

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm());
    setFieldErrors({});
    setError('');
    const id = window.setTimeout(() => amountRef.current?.focus(), 50);

    let cancelled = false;
    const token = readPersistedSession()?.accessToken;
    if (token) {
      clinicApi
        .expenseCategories(token)
        .then((rows) => {
          if (!cancelled) setCustomCategories(rows);
        })
        .catch(() => {
          /* built-in categories still work */
        });
    }
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [open]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (key === 'amount' || key === 'category' || key === 'date') {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const amountValue = Number(form.amount || 0);

  function setAmountDigits(raw: string) {
    const digits = raw.replace(/\D/g, '').replace(/^0+/, '').slice(0, 10);
    set('amount', digits);
  }

  function addQuick(value: number) {
    set('amount', String(Math.min(MAX_AMOUNT, amountValue + value)));
    amountRef.current?.focus();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const errs: FieldErrors = {};
    if (amountValue <= 0) errs.amount = t('crm.finance.expense_modal.amount_required');
    else if (amountValue > MAX_AMOUNT) errs.amount = t('crm.finance.expense_modal.amount_too_large');
    if (!form.category) errs.category = t('crm.finance.expense_modal.category_required');
    if (!form.date) errs.date = t('crm.finance.expense_modal.date_required');
    else if (form.date > todayIso()) errs.date = t('crm.finance.expense_modal.date_future');
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0 || !form.category) return;

    const token = readPersistedSession()?.accessToken;
    if (!token) return;

    setLoading(true);
    try {
      await clinicApi.createExpense(token, {
        amount: amountValue,
        ...(form.category.kind === 'builtin'
          ? { category: form.category.key }
          : { categoryId: form.category.id }),
        paymentMethod: form.method,
        date: form.date,
        serviceName: form.name.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      closeLabel={t('crm.finance.expense_modal.close')}
      icon={
        <ModalIcon tone="danger">
          <ReceiptText className="h-5 w-5" strokeWidth={2} />
        </ModalIcon>
      }
      title={t('crm.finance.expense_modal.title')}
      subtitle={t('crm.finance.expense_modal.subtitle')}
    >
      <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <ModalBody>
          <section
            className={cn(
              'rounded-2xl bg-gradient-to-br from-rose-50 via-white to-white p-4 ring-1 tablet:p-5',
              fieldErrors.amount ? 'ring-red-300' : 'ring-rose-100',
            )}
          >
            <label
              htmlFor={amountId}
              className="text-xs font-semibold uppercase tracking-[0.04em] text-rose-500"
            >
              {t('crm.finance.expense_modal.amount')}
            </label>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-rose-400">−</span>
              <input
                ref={amountRef}
                id={amountId}
                inputMode="numeric"
                autoComplete="off"
                placeholder="0"
                value={groupDigits(form.amount)}
                onChange={(e) => setAmountDigits(e.target.value)}
                aria-invalid={Boolean(fieldErrors.amount)}
                className="min-w-0 flex-1 bg-transparent text-3xl font-semibold tabular-nums tracking-tight text-slate-900 outline-none placeholder:text-slate-300 tablet:text-4xl"
              />
              <span className="shrink-0 text-base font-medium text-slate-400">
                {t('crm.finance.expense_modal.currency')}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => addQuick(v)}
                  className="inline-flex h-8 items-center rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold tabular-nums text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                >
                  +{groupDigits(String(v))}
                </button>
              ))}
            </div>
            {fieldErrors.amount ? (
              <p className="mt-2 text-xs font-medium text-red-600">{fieldErrors.amount}</p>
            ) : null}
          </section>

          <ModalSection title={t('crm.finance.expense_modal.category')}>
            <ExpenseCategoryPicker
              value={form.category}
              onChange={(v) => set('category', v)}
              custom={customCategories}
              onCustomCreated={(c) =>
                setCustomCategories((prev) =>
                  [...prev, c].sort((a, b) => a.name.localeCompare(b.name)),
                )
              }
              error={fieldErrors.category}
            />
          </ModalSection>

          <ModalSection title={t('crm.finance.expense_modal.details')}>
            <div className="space-y-3">
              <div className="grid gap-3 tablet:grid-cols-2">
                <DatePicker
                  label={t('crm.finance.expense_modal.date')}
                  value={form.date}
                  max={todayIso()}
                  onChange={(iso) => set('date', iso)}
                  error={fieldErrors.date}
                />
                <div className="space-y-1.5">
                  <span className="block text-sm font-medium text-slate-700">
                    {t('crm.finance.expense_modal.method')}
                  </span>
                  <div
                    role="radiogroup"
                    aria-label={t('crm.finance.expense_modal.method')}
                    className="grid h-12 grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-slate-50/80 p-1"
                  >
                    {METHODS.map(({ id, icon: Icon }) => {
                      const active = form.method === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => set('method', id)}
                          className={cn(
                            'inline-flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition',
                            active
                              ? 'bg-white text-primary shadow-sm ring-1 ring-slate-200'
                              : 'text-slate-500 hover:text-slate-700',
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">
                            {t(`crm.finance.expense_modal.methods.${id}`)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <AuthField
                label={`${t('crm.finance.expense_modal.name')} (${t('crm.finance.expense_modal.optional')})`}
                value={form.name}
                maxLength={200}
                onChange={(e) => set('name', e.target.value)}
                placeholder={t('crm.finance.expense_modal.name_placeholder')}
                autoComplete="off"
              />

              <div className="space-y-1.5">
                <label htmlFor={notesId} className="block text-sm font-medium text-slate-700">
                  {`${t('crm.finance.expense_modal.notes')} (${t('crm.finance.expense_modal.optional')})`}
                </label>
                <textarea
                  id={notesId}
                  rows={3}
                  maxLength={1000}
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  placeholder={t('crm.finance.expense_modal.notes_placeholder')}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </ModalSection>

          {error ? <FormError>{error}</FormError> : null}
        </ModalBody>

        <ModalFooter>
          <AuthButton variant="secondary" onClick={onClose} className="tablet:w-auto tablet:px-5">
            {t('crm.finance.expense_modal.cancel')}
          </AuthButton>
          <AuthButton type="submit" loading={loading} className="tablet:w-auto tablet:px-6">
            {!loading ? <ReceiptText className="h-4 w-4" /> : null}
            {t('crm.finance.expense_modal.submit')}
            {amountValue > 0 ? (
              <span className="rounded-md bg-white/15 px-1.5 py-0.5 tabular-nums">
                {groupDigits(form.amount)} {t('crm.finance.expense_modal.currency')}
              </span>
            ) : null}
          </AuthButton>
        </ModalFooter>
      </form>
    </ModalShell>
  );
}
