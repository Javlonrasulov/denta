'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Panel } from '@/components/ui/crm';
import { readPersistedSession } from '@/lib/auth/session';
import { useCrmI18n } from '@/lib/i18n/useCrmI18n';

type MemberRow = {
  id: string;
  fullName: string;
  role: string;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  effectivePermissions: string[];
  permissionOverrides?: { permission: string; effect: 'ALLOW' | 'DENY' }[];
};

type InvitationRow = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
  expiresAt: string;
};

const PERMISSION_GROUPS: { label: string; keys: string[] }[] = [
  {
    label: 'Qabullar',
    keys: ['appointment:create', 'appointment:update'],
  },
  {
    label: 'Bemorlar',
    keys: ['patient:read', 'patient:write', 'patient:update'],
  },
  {
    label: 'Moliya',
    keys: ['finance:read', 'finance:write'],
  },
  {
    label: 'Ombor',
    keys: ['inventory:read', 'inventory:manage'],
  },
  {
    label: 'Hisobotlar',
    keys: ['reports:read'],
  },
  {
    label: 'Sozlamalar',
    keys: ['settings:manage', 'members:manage'],
  },
];

function permLabel(key: string): string {
  const map: Record<string, string> = {
    'appointment:create': 'Yaratish',
    'appointment:update': 'Tahrirlash',
    'patient:read': 'Ko‘rish',
    'patient:write': 'Tahrirlash',
    'patient:update': 'Yangilash',
    'finance:read': 'Ko‘rish',
    'finance:write': 'Tahrirlash',
    'inventory:read': 'Ko‘rish',
    'inventory:manage': 'Boshqarish',
    'reports:read': 'Ko‘rish',
    'settings:manage': 'Boshqarish',
    'members:manage': 'Xodimlar',
  };
  return map[key] ?? key;
}

export default function EmployeesPage() {
  const { t: _t } = useCrmI18n();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [invitations, setInvitations] = useState<InvitationRow[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPerms, setEditPerms] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '+998 ',
    email: '',
    role: 'RECEPTIONIST',
    specialty: '',
  });
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');

  const load = useCallback(async () => {
    if (!apiBase) {
      setLoading(false);
      setError('API not configured');
      return;
    }
    const token = readPersistedSession()?.accessToken;
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/clinics/me/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load members');
      const data = (await res.json()) as MemberRow[];
      setMembers(data);
      const invRes = await fetch(`${apiBase}/clinics/me/invitations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (invRes.ok) {
        setInvitations((await invRes.json()) as InvitationRow[]);
      }
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    const token = readPersistedSession()?.accessToken;
    if (!token || !apiBase) return;
    setTempPassword(null);
    const res = await fetch(`${apiBase}/clinics/me/members`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        email: form.email || undefined,
        role: form.role,
        specialty: form.role === 'DOCTOR' ? form.specialty || 'Stomatolog' : undefined,
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.message || body.code || 'Create failed');
      return;
    }
    if (body.temporaryPassword) setTempPassword(body.temporaryPassword);
    if (body.activationToken && process.env.NODE_ENV !== 'production') {
      setTempPassword(`Invite token (DEV): ${body.activationToken}`);
    } else if (body.kind === 'invitation') {
      setTempPassword('Taklif yuborildi — email orqali faollashtirish');
    }
    setForm({
      firstName: '',
      lastName: '',
      phone: '+998 ',
      email: '',
      role: 'RECEPTIONIST',
      specialty: '',
    });
    await load();
  }

  async function deactivate(id: string) {
    const token = readPersistedSession()?.accessToken;
    if (!token || !apiBase) return;
    await fetch(`${apiBase}/clinics/me/members/${id}/deactivate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    await load();
  }

  async function reactivate(id: string) {
    const token = readPersistedSession()?.accessToken;
    if (!token || !apiBase) return;
    await fetch(`${apiBase}/clinics/me/members/${id}/reactivate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    await load();
  }

  function openEdit(m: MemberRow) {
    setEditingId(m.id);
    setEditPerms(new Set(m.effectivePermissions ?? []));
  }

  function togglePerm(key: string) {
    setEditPerms((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function savePermissions() {
    if (!editingId || !apiBase) return;
    const token = readPersistedSession()?.accessToken;
    if (!token) return;
    const member = members.find((m) => m.id === editingId);
    if (!member) return;

    // Role defaults are applied on backend; send ALLOW for extras and DENY for removed role defaults.
    // Simpler approach: send explicit ALLOW for checked, DENY for unchecked manageable keys.
    const allKeys = PERMISSION_GROUPS.flatMap((g) => g.keys);
    const permissions = allKeys.map((permission) => ({
      permission,
      effect: editPerms.has(permission) ? ('ALLOW' as const) : ('DENY' as const),
    }));

    const res = await fetch(`${apiBase}/clinics/me/members/${editingId}/permissions`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ permissions }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.message || 'Permission update failed');
      return;
    }
    setEditingId(null);
    await load();
  }

  async function resendInvite(id: string) {
    const token = readPersistedSession()?.accessToken;
    if (!token || !apiBase) return;
    const res = await fetch(`${apiBase}/clinics/me/invitations/${id}/resend`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.message || 'Resend failed');
      return;
    }
    await load();
  }

  function inviteStatusLabel(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'Kutilmoqda';
      case 'ACCEPTED':
        return 'Faol';
      case 'EXPIRED':
        return 'Muddati tugagan';
      case 'REVOKED':
        return 'Bekor qilingan';
      default:
        return status;
    }
  }

  return (
    <AppShell title="Xodimlar" subtitle="Klinikaga xodim qo‘shish va ruxsatlar">
      <div className="space-y-6">
        <div className="text-sm text-slate-500">
          <Link href="/settings" className="text-primary hover:underline">
            ← Sozlamalar
          </Link>
        </div>

        <Panel title="Xodim qo‘shish">
          <form onSubmit={onCreate} className="grid gap-3 tablet:grid-cols-2">
            <input
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
              placeholder="Ism"
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              required
            />
            <input
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
              placeholder="Familiya"
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              required
            />
            <input
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
              placeholder="Telefon"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              required
            />
            <input
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
              placeholder="Email (ixtiyoriy)"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            <select
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            >
              <option value="RECEPTIONIST">Receptionist</option>
              <option value="ACCOUNTANT">Accountant</option>
              <option value="CLINIC_ADMIN">Clinic Admin</option>
              <option value="DOCTOR">Doctor</option>
            </select>
            {form.role === 'DOCTOR' ? (
              <input
                className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
                placeholder="Specialty"
                value={form.specialty}
                onChange={(e) => setForm((f) => ({ ...f, specialty: e.target.value }))}
              />
            ) : null}
            <button
              type="submit"
              className="h-11 rounded-xl bg-primary text-sm font-semibold text-white tablet:col-span-2"
            >
              Qo‘shish / Invite
            </button>
          </form>
          {tempPassword ? (
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Bir martalik ma’lumot (qayta ko‘rsatilmaydi): {tempPassword}
            </p>
          ) : null}
          {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        </Panel>

        <Panel title="Takliflar">
          <div className="divide-y divide-slate-100">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="font-medium text-slate-900">{inv.fullName}</p>
                  <p className="text-xs text-slate-500">
                    {inv.role} · {inv.email ?? inv.phone ?? '—'} ·{' '}
                    {inviteStatusLabel(inv.status)}
                    {inv.status === 'PENDING' ? ' · Taklif yuborildi' : ''}
                  </p>
                </div>
                {inv.status === 'PENDING' || inv.status === 'EXPIRED' ? (
                  <button
                    type="button"
                    onClick={() => void resendInvite(inv.id)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Qayta yuborish
                  </button>
                ) : null}
              </div>
            ))}
            {!invitations.length ? (
              <p className="py-4 text-sm text-slate-500">Hali taklif yo‘q</p>
            ) : null}
          </div>
        </Panel>

        <Panel title="Jamoa">
          {loading ? (
            <p className="text-sm text-slate-500">Yuklanmoqda…</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {members.map((m) => (
                <div key={m.id} className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{m.fullName}</p>
                      <p className="text-xs text-slate-500">
                        {m.role} · {m.phone ?? m.email ?? '—'} ·{' '}
                        {m.isActive ? 'Faol' : 'Faolsizlantirilgan'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {m.isActive && m.role !== 'CLINIC_OWNER' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => openEdit(m)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                          >
                            Ruxsatlar
                          </button>
                          <button
                            type="button"
                            onClick={() => void deactivate(m.id)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                          >
                            Deactivate
                          </button>
                        </>
                      ) : null}
                      {!m.isActive ? (
                        <button
                          type="button"
                          onClick={() => void reactivate(m.id)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          Reactivate
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {editingId === m.id ? (
                    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                      <p className="mb-3 text-sm font-semibold text-slate-800">
                        Ruxsatlar — {m.fullName}
                      </p>
                      <div className="grid gap-4 tablet:grid-cols-2">
                        {PERMISSION_GROUPS.map((group) => (
                          <div key={group.label}>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              {group.label}
                            </p>
                            <div className="space-y-1.5">
                              {group.keys.map((key) => (
                                <label
                                  key={key}
                                  className="flex items-center gap-2 text-sm text-slate-700"
                                >
                                  <input
                                    type="checkbox"
                                    checked={editPerms.has(key)}
                                    onChange={() => togglePerm(key)}
                                    className="rounded border-slate-300"
                                  />
                                  {permLabel(key)}
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => void savePermissions()}
                          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          Saqlash
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600"
                        >
                          Bekor
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
              {!members.length ? (
                <p className="py-4 text-sm text-slate-500">Hali xodim yo‘q</p>
              ) : null}
            </div>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}
