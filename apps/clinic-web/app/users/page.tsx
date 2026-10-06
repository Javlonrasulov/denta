'use client';

import {
  ChevronRight,
  Crown,
  Eye,
  Pencil,
  PencilLine,
  Stethoscope,
  Trash2,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Panel } from '@/components/ui/crm';
import { AddStaffModal } from '@/components/users/AddStaffModal';
import { DeleteStaffDialog } from '@/components/users/DeleteStaffDialog';
import { EditStaffModal } from '@/components/users/EditStaffModal';
import { clinicApi, type ClinicMember } from '@/lib/api/clinic-api';
import { formatUzPhoneDisplay } from '@/lib/auth/phone';
import { readPersistedSession } from '@/lib/auth/session';
import { cn } from '@/lib/cn';
import { useCrmI18n } from '@/lib/i18n/useCrmI18n';
import { PAGE_ACCESS, ROLE_BADGES, accessFromPermissions } from '@/lib/staff';

const MAX_CHIPS = 4;

function initials(m: ClinicMember): string {
  return `${m.firstName.charAt(0)}${m.lastName.charAt(0)}`.toUpperCase() || '—';
}

function AccessChips({ member }: { member: ClinicMember }) {
  const { t } = useCrmI18n();

  if (member.role === 'CLINIC_OWNER') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/15">
        <Crown className="h-3.5 w-3.5" />
        {t('crm.users.full_access')}
      </span>
    );
  }

  const access = accessFromPermissions(member.effectivePermissions);
  const granted = PAGE_ACCESS.filter((p) => access[p.key] !== 'none');
  if (!granted.length) {
    return <span className="text-xs text-slate-400">{t('crm.users.overview_only')}</span>;
  }

  const shown = granted.slice(0, MAX_CHIPS);
  const rest = granted.slice(MAX_CHIPS);
  return (
    <div className="flex flex-wrap items-center gap-1">
      {shown.map((p) => {
        const manage = access[p.key] === 'manage';
        const LevelIcon = manage ? PencilLine : Eye;
        return (
          <span
            key={p.key}
            title={t(`crm.users.access.${access[p.key]}`)}
            className={cn(
              'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium',
              manage ? 'bg-primary-muted text-primary' : 'bg-slate-100 text-slate-600',
            )}
          >
            <LevelIcon className="h-3 w-3" strokeWidth={2.2} />
            {t(p.labelKey)}
          </span>
        );
      })}
      {rest.length ? (
        <span
          title={rest.map((p) => t(p.labelKey)).join(', ')}
          className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500"
        >
          +{rest.length}
        </span>
      ) : null}
    </div>
  );
}

export default function UsersPage() {
  const { t } = useCrmI18n();
  const [members, setMembers] = useState<ClinicMember[]>([]);
  const [doctorCount, setDoctorCount] = useState(0);
  const [selfId, setSelfId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<ClinicMember | null>(null);
  const [deleting, setDeleting] = useState<ClinicMember | null>(null);

  const load = useCallback(async () => {
    const session = readPersistedSession();
    const token = session?.accessToken;
    if (!token) return;
    setSelfId(session.activeWorkspace?.membershipId ?? session.user.membershipId ?? null);
    try {
      const rows = (await clinicApi.members(token)).filter((m) => m.isActive);
      // Doctors work in the mobile app and are managed on the Doctors page.
      setMembers(rows.filter((m) => m.role !== 'DOCTOR'));
      setDoctorCount(rows.filter((m) => m.role === 'DOCTOR').length);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const reload = useCallback(() => void load(), [load]);
  const closeAdd = useCallback(() => setAddOpen(false), []);
  const closeEdit = useCallback(() => setEditing(null), []);
  const closeDelete = useCallback(() => setDeleting(null), []);

  return (
    <AppShell title={t('crm.nav.users')} subtitle={t('crm.users.subtitle')}>
      <div className="space-y-6">
        {error ? (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        ) : null}

        <Panel
          title={`${t('crm.users.team')}${members.length ? ` · ${members.length}` : ''}`}
          action={
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-indigo-700"
            >
              <UserPlus className="h-4 w-4" />
              {t('crm.users.add')}
            </button>
          }
        >
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex animate-pulse items-center gap-3 py-2">
                  <div className="h-10 w-10 rounded-xl bg-slate-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-40 rounded bg-slate-100" />
                    <div className="h-3 w-24 rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : members.length ? (
            <div className="-mx-5 -my-5">
              <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_96px] gap-4 border-b border-slate-100 px-5 py-2.5 text-table-head uppercase text-slate-400 tablet:grid">
                <span>{t('crm.users.col_member')}</span>
                <span>{t('crm.users.col_access')}</span>
                <span className="text-right">{t('crm.users.col_actions')}</span>
              </div>
              <ul className="divide-y divide-slate-100">
                {members.map((m) => {
                  const badge = ROLE_BADGES[m.role];
                  const isSelf = m.id === selfId;
                  const locked = m.role === 'CLINIC_OWNER' || isSelf;
                  return (
                    <li
                      key={m.id}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-5 py-3.5 transition-colors hover:bg-slate-50/70 tablet:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_96px]"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-muted text-sm font-semibold text-primary">
                          {initials(m)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex min-w-0 items-center gap-2">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {m.fullName}
                            </p>
                            {badge ? (
                              <span
                                className={cn(
                                  'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset',
                                  badge.tone,
                                )}
                              >
                                <badge.icon className="h-3 w-3" strokeWidth={2} />
                                {t(`crm.users.roles.${m.role}`)}
                              </span>
                            ) : null}
                            {isSelf ? (
                              <span className="inline-flex shrink-0 items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                                {t('crm.users.you')}
                              </span>
                            ) : null}
                          </div>
                          <p className="truncate text-xs text-slate-500">
                            {[m.phone ? formatUzPhoneDisplay(m.phone) : null, m.email]
                              .filter(Boolean)
                              .join(' · ') || '—'}
                          </p>
                        </div>
                      </div>

                      <div className="order-3 col-span-2 min-w-0 tablet:order-none tablet:col-span-1">
                        <AccessChips member={m} />
                      </div>

                      <div className="flex justify-end gap-1.5">
                        {locked ? null : (
                          <>
                            <IconAction
                              icon={Pencil}
                              label={t('crm.users.edit')}
                              onClick={() => setEditing(m)}
                            />
                            <IconAction
                              icon={Trash2}
                              label={t('crm.users.delete')}
                              tone="danger"
                              onClick={() => setDeleting(m)}
                            />
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-muted text-primary">
                <UserPlus className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm text-slate-500">{t('crm.users.team_empty')}</p>
            </div>
          )}
        </Panel>

        {doctorCount > 0 ? (
          <Link
            href="/doctors"
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 transition hover:border-primary/30 hover:bg-primary-muted/40"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
              <Stethoscope className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">{t('crm.users.doctors_note', { count: doctorCount })}</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
          </Link>
        ) : null}
      </div>

      <AddStaffModal open={addOpen} onClose={closeAdd} onCreated={reload} />
      <EditStaffModal member={editing} onClose={closeEdit} onSaved={reload} />
      <DeleteStaffDialog member={deleting} onClose={closeDelete} onDeleted={reload} />
    </AppShell>
  );
}

function IconAction({
  icon: Icon,
  label,
  tone = 'default',
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  tone?: 'default' | 'danger';
  onClick: () => void;
}) {
  return (
    <div className="group/action relative">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={cn(
          'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm shadow-slate-900/5 transition',
          'focus-visible:outline-none focus-visible:ring-2 active:scale-95',
          tone === 'danger'
            ? 'hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 focus-visible:ring-rose-500/30'
            : 'hover:border-primary/30 hover:bg-primary-muted hover:text-primary focus-visible:ring-primary/30',
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={1.9} />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/action:opacity-100 group-hover/action:delay-150"
      >
        {label}
      </span>
    </div>
  );
}
