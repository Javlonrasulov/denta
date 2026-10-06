'use client';

import type { TFunction } from 'i18next';
import {
  Building2,
  Check,
  Ellipsis,
  Landmark,
  Megaphone,
  Package,
  Plus,
  Tag,
  Users,
  Wrench,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

import {
  clinicApi,
  EXPENSE_CATEGORIES,
  type ClinicExpenseCategory,
  type ExpenseCategory,
} from '@/lib/api/clinic-api';
import { readPersistedSession } from '@/lib/auth/session';
import { cn } from '@/lib/cn';

export type CategoryValue =
  | { kind: 'builtin'; key: ExpenseCategory }
  | { kind: 'custom'; id: string };

const BUILTIN_ICONS: Record<ExpenseCategory, LucideIcon> = {
  rent: Building2,
  salary: Users,
  materials: Package,
  equipment: Wrench,
  utilities: Zap,
  marketing: Megaphone,
  taxes: Landmark,
  other: Ellipsis,
};

function isBuiltin(name: string): name is ExpenseCategory {
  return (EXPENSE_CATEGORIES as readonly string[]).includes(name);
}

/** Built-in categories are stored by key and translated; custom ones are shown as typed. */
export function expenseCategoryLabel(t: TFunction, name: string): string {
  return isBuiltin(name) ? t(`crm.finance.expense_modal.categories.${name}`) : name;
}

const normalize = (s: string) => s.trim().replace(/\s+/g, ' ').toLocaleLowerCase();

export function ExpenseCategoryPicker({
  value,
  onChange,
  custom,
  onCustomCreated,
  error,
}: {
  value: CategoryValue | null;
  onChange: (value: CategoryValue) => void;
  custom: ClinicExpenseCategory[];
  onCustomCreated: (category: ClinicExpenseCategory) => void;
  error?: string;
}) {
  const { t } = useTranslation();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (creating) inputRef.current?.focus();
  }, [creating]);

  function closeCreator() {
    setCreating(false);
    setNewName('');
    setCreateError('');
  }

  async function create() {
    const name = newName.trim().replace(/\s+/g, ' ');
    if (name.length < 2) {
      setCreateError(t('crm.finance.expense_modal.new_category_short'));
      return;
    }

    const key = normalize(name);
    const builtin = EXPENSE_CATEGORIES.find(
      (k) => k === key || normalize(t(`crm.finance.expense_modal.categories.${k}`)) === key,
    );
    if (builtin) {
      onChange({ kind: 'builtin', key: builtin });
      closeCreator();
      return;
    }
    const existing = custom.find((c) => normalize(c.name) === key);
    if (existing) {
      onChange({ kind: 'custom', id: existing.id });
      closeCreator();
      return;
    }

    const token = readPersistedSession()?.accessToken;
    if (!token) return;
    setSaving(true);
    setCreateError('');
    try {
      const created = await clinicApi.createExpenseCategory(token, name);
      onCustomCreated(created);
      onChange({ kind: 'custom', id: created.id });
      closeCreator();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      void create();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      closeCreator();
    }
  }

  const tiles: { value: CategoryValue; label: string; icon: LucideIcon; key: string }[] = [
    ...EXPENSE_CATEGORIES.map((k) => ({
      key: k,
      value: { kind: 'builtin', key: k } as CategoryValue,
      label: t(`crm.finance.expense_modal.categories.${k}`),
      icon: BUILTIN_ICONS[k],
    })),
    ...custom.map((c) => ({
      key: c.id,
      value: { kind: 'custom', id: c.id } as CategoryValue,
      label: c.name,
      icon: Tag,
    })),
  ];

  const isActive = (v: CategoryValue) =>
    value?.kind === v.kind &&
    (v.kind === 'builtin'
      ? value.kind === 'builtin' && value.key === v.key
      : value.kind === 'custom' && value.id === v.id);

  return (
    <div>
      <div
        role="radiogroup"
        aria-label={t('crm.finance.expense_modal.category')}
        className="grid grid-cols-2 gap-2 tablet:grid-cols-4"
      >
        {tiles.map(({ key, value: v, label, icon: Icon }) => {
          const active = isActive(v);
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={active}
              title={label}
              onClick={() => onChange(v)}
              className={cn(
                'group flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition',
                active
                  ? 'border-primary bg-primary-muted text-primary ring-2 ring-primary/15'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
              )}
            >
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition',
                  active ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-white',
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
              </span>
              <span className="truncate">{label}</span>
            </button>
          );
        })}

        {!creating ? (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex items-center gap-2.5 rounded-xl border border-dashed border-slate-300 px-3 py-2.5 text-left text-sm font-medium text-slate-500 transition hover:border-primary hover:bg-primary-muted/50 hover:text-primary"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50">
              <Plus className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <span className="truncate">{t('crm.finance.expense_modal.new_category')}</span>
          </button>
        ) : null}
      </div>

      {creating ? (
        <div className="mt-2 rounded-xl border border-primary/30 bg-primary-muted/40 p-2">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-primary ring-1 ring-primary/20">
              <Tag className="h-4 w-4" />
            </span>
            <input
              ref={inputRef}
              value={newName}
              maxLength={60}
              onChange={(e) => {
                setNewName(e.target.value);
                setCreateError('');
              }}
              onKeyDown={onKeyDown}
              placeholder={t('crm.finance.expense_modal.new_category_placeholder')}
              aria-label={t('crm.finance.expense_modal.new_category')}
              className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="button"
              onClick={() => void create()}
              disabled={saving}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              )}
              <span className="hidden tablet:inline">
                {t('crm.finance.expense_modal.new_category_create')}
              </span>
            </button>
            <button
              type="button"
              onClick={closeCreator}
              aria-label={t('crm.finance.expense_modal.cancel')}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {createError ? (
            <p className="mt-1.5 px-1 text-xs font-medium text-red-600">{createError}</p>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="mt-2 text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}
