'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, use, useEffect, useState } from 'react';

export default function InviteAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');
  const [info, setInfo] = useState<{
    firstName: string;
    lastName: string;
    role: string;
    email: string | null;
  } | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!apiBase) {
      setError('API not configured');
      return;
    }
    void (async () => {
      const res = await fetch(`${apiBase}/invitations/${token}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.code || body.message || 'Invitation invalid');
        return;
      }
      setInfo(body);
    })();
  }, [apiBase, token]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!apiBase) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiBase}/invitations/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.code || body.message || 'Accept failed');
        return;
      }
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">Taklifni qabul qilish</h1>
        {info ? (
          <p className="text-sm text-slate-600">
            {info.firstName} {info.lastName} · {info.role}
            {info.email ? ` · ${info.email}` : ''}
          </p>
        ) : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {info && !String(error).includes('INVITATION') ? (
          <form onSubmit={onSubmit} className="space-y-3">
            <input
              type="password"
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
              placeholder="Yangi parol"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-white"
            >
              Faollashtirish
            </button>
          </form>
        ) : null}
        <Link href="/login" className="block text-center text-sm text-primary hover:underline">
          Login
        </Link>
      </div>
    </div>
  );
}
