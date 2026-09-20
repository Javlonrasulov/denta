'use client';

import { MOCK_ROOMS } from '@denta/mocks';
import { AppShell } from '@/components/layout/AppShell';
import { Badge, Panel } from '@/components/ui/crm';
import { useCrmI18n } from '@/lib/i18n/useCrmI18n';

export default function RoomsPage() {
  const { t, status } = useCrmI18n();

  return (
    <AppShell title={t('crm.rooms.title')} subtitle={t('crm.rooms.subtitle')}>
      <div className="grid gap-4 tablet:grid-cols-2 laptop:grid-cols-3">
        {MOCK_ROOMS.map((room) => (
          <div
            key={room.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-caption font-medium uppercase tracking-[0.04em] text-slate-400">
                  {t('crm.rooms.room_n', { number: room.number })}
                </p>
                <h3 className="mt-1 text-section-title text-slate-900">{room.name}</h3>
              </div>
              <Badge status={room.status}>{status(room.status)}</Badge>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              {room.doctorName ?? t('crm.rooms.unassigned')}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <Panel title={t('crm.rooms.notes')}>
          <p className="text-sm text-slate-500">{t('crm.rooms.notes_body')}</p>
        </Panel>
      </div>
    </AppShell>
  );
}
