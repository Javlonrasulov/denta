'use client';

import { Building2, ChevronDown, Check } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { getAuthService } from '@/lib/auth';
import { readPersistedSession } from '@/lib/auth/session';
import type { WorkspaceDto } from '@/lib/auth/types';
import { cn } from '@/lib/cn';
import { handleMenuKeyDown, useDismiss } from '@/lib/use-dismiss';

export function WorkspaceSwitcher({ className }: { className?: string }) {
  const { refresh, isMock } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<WorkspaceDto[]>([]);
  const [active, setActive] = useState<WorkspaceDto | null>(null);
  const [busy, setBusy] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, rootRef, close, triggerRef);

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
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        disabled={busy}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        className={cn(
          'inline-flex h-10 max-w-[220px] items-center gap-2 rounded-xl border border-line bg-card pl-2 pr-2.5 text-[13px] font-semibold text-fg shadow-card outline-none transition-[background-color,border-color] duration-150',
          'hover:border-line-strong hover:bg-hover disabled:opacity-60',
          'focus-visible:ring-2 focus-visible:ring-focus/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
          open && 'border-primary/40 bg-primary/5',
        )}
        title={active?.clinicName}
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Building2 aria-hidden className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1 truncate text-left">{active?.clinicName ?? 'Workspace'}</span>
        <ChevronDown
          aria-hidden
          className={cn('h-3.5 w-3.5 shrink-0 text-fg-subtle transition-transform duration-200', open && 'rotate-180')}
        />
      </button>
      {open ? (
        <div
          id={listId}
          role="listbox"
          onKeyDown={handleMenuKeyDown}
          className="popover-panel absolute right-0 mt-2 w-72 origin-top-right p-1.5"
        >
          {workspaces.map((w) => {
            const selected = w.clinicId === active?.clinicId;
            return (
              <button
                key={w.membershipId}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => void switchTo(w.clinicId)}
                className={cn('menu-item items-start', selected && 'bg-primary/10 text-primary hover:bg-primary/10')}
              >
                <Building2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 opacity-70" strokeWidth={2} />
                <span className="min-w-0 flex-1 whitespace-normal break-words">{w.clinicName}</span>
                {selected ? <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
