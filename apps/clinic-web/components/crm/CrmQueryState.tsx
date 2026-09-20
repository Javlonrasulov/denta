'use client';

import { API_NOT_CONFIGURED_MESSAGE } from '@/lib/api/useClinicData';

export function CrmQueryState({
  apiConfigured,
  loading,
  error,
  children,
}: {
  apiConfigured: boolean;
  loading: boolean;
  error: Error | null;
  children: React.ReactNode;
}) {
  if (!apiConfigured) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
        <p className="text-sm font-medium text-slate-700">{API_NOT_CONFIGURED_MESSAGE}</p>
      </div>
    );
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading…</p>;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-8 text-center">
        <p className="text-sm font-medium text-rose-700">{error.message}</p>
      </div>
    );
  }

  return children;
}
