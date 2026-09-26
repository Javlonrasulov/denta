'use client';

import { Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { getAuthService } from '@/lib/auth';
import { readPersistedSession } from '@/lib/auth/session';
import type { WorkspaceDto } from '@/lib/auth/types';

export default function SelectWorkspacePage() {
  const { refresh } = useAuth();
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<WorkspaceDto[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const session = readPersistedSession();
    const list = session?.workspaces ?? [];
    setWorkspaces(list);
    if (list.length <= 1 && session?.activeWorkspace) {
      router.replace('/overview');
    }
  }, [router]);

  async function select(clinicId: string) {
    setBusy(true);
    setError('');
    try {
      const service = getAuthService();
      if (!service.switchWorkspace) throw new Error('Unavailable');
      await service.switchWorkspace(clinicId);
      await refresh();
      router.replace('/overview');
    } catch {
      setError('Workspace switch failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold text-slate-900">Klinikani tanlang</h1>
        </div>
        <p className="text-sm text-slate-500">
          Bir nechta klinikaga bog‘langansiz. Davom etish uchun birini tanlang.
        </p>
        <div className="space-y-2">
          {workspaces.map((w) => (
            <button
              key={w.membershipId}
              type="button"
              disabled={busy}
              onClick={() => void select(w.clinicId)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-800 hover:border-primary hover:bg-primary/5"
            >
              <span>{w.clinicName}</span>
              <span className="text-xs text-slate-400">{w.role}</span>
            </button>
          ))}
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}
