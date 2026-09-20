'use client';

import { cn } from '@/lib/cn';

type Insight = {
  label: string;
  value: string;
};

export function PatientFlowInsights({
  items,
  className,
}: {
  items: Insight[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid gap-3 sm:grid-cols-2 laptop:grid-cols-4',
        className,
      )}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl bg-slate-50/90 px-3.5 py-3 ring-1 ring-inset ring-slate-200/70"
        >
          <p className="text-caption font-medium tracking-normal text-slate-500">
            {item.label}
          </p>
          <p className="mt-1 text-sm font-semibold tracking-normal text-slate-900">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
