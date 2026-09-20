'use client';

type TooltipPayload = {
  payload?: {
    label: string;
    total: number;
    new: number;
    returning: number;
  };
};

export function PatientFlowTooltip({
  active,
  payload,
  labels,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  labels: {
    patients: string;
    newPatients: string;
    returning: string;
  };
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="min-w-[148px] rounded-xl border border-slate-200/90 bg-white/95 px-3.5 py-3 shadow-lg shadow-slate-900/10 backdrop-blur">
      <p className="text-sm font-semibold tracking-normal text-slate-900">{point.label}</p>
      <p className="mt-1.5 text-sm font-medium text-indigo-700">
        {point.total} {labels.patients}
      </p>
      <div className="mt-2 space-y-1 border-t border-slate-100 pt-2 text-caption text-slate-500">
        <p>
          {labels.newPatients}:{' '}
          <span className="font-medium text-slate-700">{point.new}</span>
        </p>
        <p>
          {labels.returning}:{' '}
          <span className="font-medium text-slate-700">{point.returning}</span>
        </p>
      </div>
    </div>
  );
}
