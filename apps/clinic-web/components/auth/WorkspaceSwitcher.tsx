'use client';

import { Building2, ChevronDown, Check } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { getAuthService } from '@/lib/auth';
import { readPersistedSession } from '@/lib/auth/session';
import type { WorkspaceDto } from '@/lib/auth/types';
import { cn } from '@/lib/cn';

export function WorkspaceSwitcher() {
  const { refresh, isMock } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<WorkspaceDto[]>([]);
  const [active, setActive] = useState<WorkspaceDto | null>(null);
  const [busy, setBusy] = useState(false);

  const syncFromSession = useCallback(() => {
    const session = readPersistedSession();
    setWorkspaces(session?.workspaces ?? []);
    setActive(session?.activeWorkspace ?? null);
  }, []);

  useEffect(() => {
    syncFromSession();
  }, [syncFromSession]);

  if (isMock || workspaces.length <= 1) return null;

  async function switchTo(clinicId: string) {
    if (clinicId === active?.clinicId) {
      setOpen(false);
      return;
    }
    setBusy(true);
    try {
      const service = getAuthService();
      if (!service.switchWorkspace) return;
      const session = await service.switchWorkspace(clinicId);
      setActive(session.activeWorkspace ?? null);
      setWorkspaces(session.workspaces ?? []);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('crm.cache');
      }
      const { notifyRealtimeWorkspaceSwitch } = await import('@/lib/realtime');
      notifyRealtimeWorkspaceSwitch(clinicId);
      await refresh();
      router.refresh();
      router.replace('/overview');
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        disabled={busy}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 max-w-[320px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        title={active?.clinicName}
      >
        <Building2 className="h-3.5 w-3.5 shrink-0 text-primary" />
        <span className="min-w-0 flex-1 text-left leading-tight">
          {active?.clinicName ?? 'Workspace'}
        </span>
        <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 text-slate-400', open && 'rotate-180')} />
      </button>
      {open ? (
        <>
          <button type="button" className="fixed inset-0 z-40" aria-label="Close" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
            {workspaces.map((w) => (
              <button
                key={w.membershipId}
                type="button"
                onClick={() => void switchTo(w.clinicId)}
                className={cn(
                  'flex w-full items-start gap-2 rounded-xl px-3 py-2.5 text-left text-sm',
                  w.clinicId === active?.clinicId
                    ? 'bg-primary/10 font-semibold text-primary'
                    : 'font-medium text-slate-700 hover:bg-slate-50',
                )}
              >
                <span className="min-w-0 flex-1 whitespace-normal break-words">{w.clinicName}</span>
                {w.clinicId === active?.clinicId ? <Check className="mt-0.5 h-4 w-4 shrink-0" /> : null}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
