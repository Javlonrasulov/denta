'use client';

import {
  AlertTriangle,
  Check,
  Loader2,
  PencilLine,
  Plus,
  RotateCw,
  Settings2,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { clinicApi, type ClinicDoctorSpecialty } from '@/lib/api/clinic-api';
import { readPersistedSession } from '@/lib/auth/session';
import { cn } from '@/lib/cn';

const MAX_NAME = 60;

type ApiErr = Error & { code?: string };

function cleanName(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim();
}

function sameName(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

/** Applies a catalog rename (`to` set) or delete (`to` null) to a selection. */
export function applyCatalogChange(list: string[], from: string, to: string | null): string[] {
  return to === null
    ? list.filter((v) => !sameName(v, from))
    : list.map((v) => (sameName(v, from) ? to : v));
}

export function SpecialtyPicker({
  value,
  onChange,
  error,
  label,
  onCatalogChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  error?: string;
  /** Renders a form-field label instead of the modal section heading. */
  label?: string;
  /** Fired after a rename (`to` = new name) or delete (`to` = null) has been persisted. */
  onCatalogChange?: (from: string, to: string | null) => void;
}) {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState<ClinicDoctorSpecialty[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [mode, setMode] = useState<'pick' | 'manage'>('pick');
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const valueRef = useRef(value);
  valueRef.current = value;

  const load = useCallback(async () => {
    const token = readPersistedSession()?.accessToken;
    if (!token) return;
    setLoadError(false);
    try {
      setItems(await clinicApi.doctorSpecialties(token, i18n.language));
    } catch {
      setLoadError(true);
    }
  }, [i18n.language]);

  useEffect(() => {
    void load();
  }, [load]);

  function messageFor(err: unknown): string {
    const e = err as ApiErr;
    if (e.code === 'SPECIALTY_EXISTS') return t('crm.doctors.specialty.errors.exists');
    if (e.code === 'INVALID_SPECIALTY_NAME') return t('crm.doctors.specialty.errors.invalid');
    return t('crm.doctors.specialty.errors.generic');
  }

  function validate(name: string, exceptId?: string): string | null {
    if (!name || name.length > MAX_NAME || name.includes(',')) {
      return t('crm.doctors.specialty.errors.invalid');
    }
    if (items?.some((i) => i.id !== exceptId && sameName(i.name, name))) {
      return t('crm.doctors.specialty.errors.exists');
    }
    return null;
  }

  async function run<T>(fn: (token: string) => Promise<T>): Promise<T | null> {
    const token = readPersistedSession()?.accessToken;
    if (!token) return null;
    setBusy(true);
    setActionError('');
    try {
      return await fn(token);
    } catch (err) {
      setActionError(messageFor(err));
      return null;
    } finally {
      setBusy(false);
    }
  }

  function toggle(name: string) {
    const current = valueRef.current;
    const selected = current.some((v) => sameName(v, name));
    const next = selected ? current.filter((v) => !sameName(v, name)) : [...current, name];
    valueRef.current = next;
    onChange(next);
  }

  async function add() {
    const name = cleanName(newName);
    const invalid = validate(name);
    if (invalid) {
      setActionError(invalid);
      return;
    }
    const created = await run((token) => clinicApi.createDoctorSpecialty(token, name));
    if (!created) return;
    setItems((prev) => [...(prev ?? []), created]);
    if (mode === 'pick') onChange([...valueRef.current, created.name]);
    setNewName('');
    setAdding(false);
  }

  async function rename(item: ClinicDoctorSpecialty) {
    const name = cleanName(editName);
    if (name === item.name) {
      setEditingId(null);
      return;
    }
    const invalid = validate(name, item.id);
    if (invalid) {
      setActionError(invalid);
      return;
    }
    const updated = await run((token) => clinicApi.renameDoctorSpecialty(token, item.id, name));
    if (!updated) return;
    setItems((prev) => (prev ?? []).map((i) => (i.id === item.id ? { ...i, name: updated.name } : i)));
    onChange(applyCatalogChange(valueRef.current, item.name, updated.name));
    onCatalogChange?.(item.name, updated.name);
    setEditingId(null);
  }

  async function remove(item: ClinicDoctorSpecialty) {
    const ok = await run((token) => clinicApi.deleteDoctorSpecialty(token, item.id));
    setConfirmDeleteId(null);
    if (!ok) return;
    setItems((prev) => (prev ?? []).filter((i) => i.id !== item.id));
    onChange(applyCatalogChange(valueRef.current, item.name, null));
    onCatalogChange?.(item.name, null);
  }

  function resetInline() {
    setAdding(false);
    setNewName('');
    setEditingId(null);
    setConfirmDeleteId(null);
    setActionError('');
  }

  const onKey =
    (submit: () => void, cancel: () => void) => (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        cancel();
      }
    };

  const header = (
    <div className={cn('flex items-center justify-between gap-3', label ? 'mb-2' : 'mb-3')}>
      <h3
        className={
          label
            ? 'text-sm font-medium text-slate-700'
            : 'text-xs font-semibold uppercase tracking-[0.04em] text-slate-400'
        }
      >
        {mode === 'manage'
          ? t('crm.doctors.specialty.manage_title')
          : (label ?? t('crm.doctors.modal.section_specialty'))}
      </h3>
      {items ? (
        <button
          type="button"
          onClick={() => {
            resetInline();
            setMode(mode === 'pick' ? 'manage' : 'pick');
          }}
          className={cn(
            'inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition',
            mode === 'manage'
              ? 'bg-primary text-white shadow-sm shadow-primary/30 hover:bg-indigo-700'
              : 'text-slate-500 hover:bg-slate-100 hover:text-primary',
          )}
        >
          {mode === 'manage' ? (
            <>
              <Check className="h-3.5 w-3.5" />
              {t('crm.doctors.specialty.done')}
            </>
          ) : (
            <>
              <Settings2 className="h-3.5 w-3.5" />
              {t('crm.doctors.specialty.manage')}
            </>
          )}
        </button>
      ) : null}
    </div>
  );

  if (!items) {
    return (
      <section>
        {header}
        {loadError ? (
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <RotateCw className="h-3.5 w-3.5" />
            {t('crm.doctors.specialty.retry')}
          </button>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {[72, 64, 88, 56, 96, 80].map((w, i) => (
              <div key={i} className="h-8 animate-pulse rounded-full bg-slate-100" style={{ width: w }} />
            ))}
          </div>
        )}
      </section>
    );
  }

  const addInput = (
    <div className="inline-flex h-8 items-center gap-1 rounded-full bg-white pl-3 pr-1 ring-2 ring-primary/40">
      <input
        autoFocus
        value={newName}
        maxLength={MAX_NAME}
        onChange={(e) => {
          setNewName(e.target.value);
          setActionError('');
        }}
        onKeyDown={onKey(() => void add(), resetInline)}
        placeholder={t('crm.doctors.specialty.new_placeholder')}
        className="w-40 bg-transparent text-xs text-slate-900 outline-none placeholder:text-slate-400"
      />
      <IconButton label={t('crm.doctors.specialty.save')} onClick={() => void add()} disabled={busy} tone="primary">
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
      </IconButton>
      <IconButton label={t('crm.doctors.specialty.cancel')} onClick={resetInline}>
        <X className="h-3.5 w-3.5" />
      </IconButton>
    </div>
  );

  return (
    <section>
      {header}

      {mode === 'pick' ? (
        <>
          <div className="flex flex-wrap gap-1.5">
            {value
              .filter((v) => !items.some((item) => sameName(item.name, v)))
              .map((name) => (
                <button
                  key={`extra-${name}`}
                  type="button"
                  aria-pressed
                  onClick={() => toggle(name)}
                  className="inline-flex h-8 items-center gap-1 rounded-full bg-primary px-3 text-xs font-medium text-white shadow-sm shadow-primary/30 ring-1 ring-inset ring-primary transition active:scale-95"
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  {name}
                </button>
              ))}
            {items.map((item) => {
              const active = value.some((v) => sameName(v, item.name));
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggle(item.name)}
                  className={cn(
                    'inline-flex h-8 items-center gap-1 rounded-full px-3 text-xs font-medium ring-1 ring-inset transition active:scale-95',
                    active
                      ? 'bg-primary text-white shadow-sm shadow-primary/30 ring-primary'
                      : 'bg-white text-slate-600 ring-slate-200 hover:text-primary hover:ring-primary/40',
                  )}
                >
                  {active ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : null}
                  {item.name}
                </button>
              );
            })}
            {adding ? (
              addInput
            ) : (
              <button
                type="button"
                onClick={() => {
                  resetInline();
                  setAdding(true);
                }}
                className="inline-flex h-8 items-center gap-1 rounded-full border border-dashed border-slate-300 px-3 text-xs font-semibold text-slate-500 transition hover:border-primary hover:bg-primary-muted hover:text-primary"
              >
                <Plus className="h-3.5 w-3.5" />
                {t('crm.doctors.specialty.add')}
              </button>
            )}
          </div>
          <p className={cn('mt-2 text-xs', error ? 'font-medium text-red-600' : 'text-slate-400')}>
            {error ??
              (value.length
                ? t('crm.doctors.specialty.selected', { count: value.length })
                : t('crm.doctors.specialty.hint'))}
          </p>
        </>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
            {items.map((item) => {
              const editing = editingId === item.id;
              const confirming = confirmDeleteId === item.id;
              return (
                <li
                  key={item.id}
                  className={cn(
                    'flex min-h-[52px] items-center gap-2.5 px-3 py-2 transition-colors',
                    confirming ? 'bg-rose-50/60' : editing ? 'bg-primary-muted/40' : 'hover:bg-slate-50/80',
                  )}
                >
                  {editing ? (
                    <>
                      <SpecialtyTile name={editName || item.name} />
                      <input
                        autoFocus
                        value={editName}
                        maxLength={MAX_NAME}
                        onChange={(e) => {
                          setEditName(e.target.value);
                          setActionError('');
                        }}
                        onKeyDown={onKey(() => void rename(item), resetInline)}
                        className="h-9 min-w-0 flex-1 rounded-lg border border-primary bg-white px-2.5 text-sm text-slate-900 outline-none ring-2 ring-primary/20"
                      />
                      <IconButton label={t('crm.doctors.specialty.save')} onClick={() => void rename(item)} disabled={busy} tone="primary">
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </IconButton>
                      <IconButton label={t('crm.doctors.specialty.cancel')} onClick={resetInline}>
                        <X className="h-4 w-4" />
                      </IconButton>
                    </>
                  ) : confirming ? (
                    <>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                        <AlertTriangle className="h-4 w-4" strokeWidth={2.2} />
                      </span>
                      <p className="min-w-0 flex-1 text-sm leading-snug text-slate-700">
                        {item.doctorCount
                          ? t('crm.doctors.specialty.delete_confirm_used', {
                              name: item.name,
                              count: item.doctorCount,
                            })
                          : t('crm.doctors.specialty.delete_confirm', { name: item.name })}
                      </p>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void remove(item)}
                        className="inline-flex h-8 items-center gap-1 rounded-lg bg-rose-600 px-3 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
                      >
                        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        {t('crm.doctors.specialty.delete')}
                      </button>
                      <button
                        type="button"
                        onClick={resetInline}
                        className="inline-flex h-8 items-center rounded-lg px-3 text-xs font-semibold text-slate-500 hover:bg-slate-100"
                      >
                        {t('crm.doctors.specialty.cancel')}
                      </button>
                    </>
                  ) : (
                    <>
                      <SpecialtyTile name={item.name} />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
                        {item.name}
                      </span>
                      {item.doctorCount ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary-muted px-2 py-0.5 text-[11px] font-semibold text-primary">
                          <Users className="h-3 w-3" strokeWidth={2.4} />
                          {t('crm.doctors.specialty.doctor_count', { count: item.doctorCount })}
                        </span>
                      ) : null}
                      <div className="flex shrink-0 items-center gap-1.5">
                        <IconButton
                          label={t('crm.doctors.specialty.edit')}
                          tone="edit"
                          onClick={() => {
                            resetInline();
                            setEditingId(item.id);
                            setEditName(item.name);
                          }}
                        >
                          <PencilLine className="h-4 w-4" strokeWidth={2.2} />
                        </IconButton>
                        <IconButton
                          label={t('crm.doctors.specialty.delete')}
                          tone="danger"
                          onClick={() => {
                            resetInline();
                            setConfirmDeleteId(item.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={2.2} />
                        </IconButton>
                      </div>
                    </>
                  )}
                </li>
              );
            })}
            {items.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm text-slate-400">
                {t('crm.doctors.specialty.empty')}
              </li>
            ) : null}
          </ul>
          <div className="border-t border-slate-100 bg-slate-50/70 px-3 py-2.5">
            {adding ? (
              addInput
            ) : (
              <button
                type="button"
                onClick={() => {
                  resetInline();
                  setAdding(true);
                }}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-primary transition hover:bg-primary-muted"
              >
                <Plus className="h-3.5 w-3.5" />
                {t('crm.doctors.specialty.add_new')}
              </button>
            )}
          </div>
        </div>
      )}

      {actionError ? (
        <p role="alert" className="mt-2 text-xs font-medium text-red-600">
          {actionError}
        </p>
      ) : null}
    </section>
  );
}

const TILE_TONES = [
  'bg-indigo-50 text-indigo-600 ring-indigo-100',
  'bg-sky-50 text-sky-600 ring-sky-100',
  'bg-emerald-50 text-emerald-600 ring-emerald-100',
  'bg-amber-50 text-amber-600 ring-amber-100',
  'bg-rose-50 text-rose-600 ring-rose-100',
  'bg-violet-50 text-violet-600 ring-violet-100',
  'bg-teal-50 text-teal-600 ring-teal-100',
  'bg-orange-50 text-orange-600 ring-orange-100',
];

function tileTone(name: string): string {
  let hash = 0;
  for (const ch of name.toLowerCase()) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return TILE_TONES[hash % TILE_TONES.length];
}

function SpecialtyTile({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ring-1 ring-inset',
        tileTone(name),
      )}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function IconButton({
  label,
  onClick,
  children,
  disabled,
  tone = 'neutral',
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  tone?: 'neutral' | 'edit' | 'primary' | 'danger';
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset transition-all duration-150 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40',
        tone === 'primary' &&
          'bg-primary text-white shadow-sm shadow-primary/30 ring-primary hover:bg-indigo-700',
        tone === 'edit' &&
          'bg-indigo-50 text-primary ring-indigo-100 hover:-translate-y-px hover:bg-primary hover:text-white hover:shadow-md hover:shadow-primary/25 hover:ring-primary',
        tone === 'danger' &&
          'bg-rose-50 text-rose-500 ring-rose-100 hover:-translate-y-px hover:bg-rose-500 hover:text-white hover:shadow-md hover:shadow-rose-500/25 hover:ring-rose-500',
        tone === 'neutral' && 'bg-slate-50 text-slate-500 ring-slate-200 hover:bg-slate-100 hover:text-slate-700',
      )}
    >
      {children}
    </button>
  );
}
