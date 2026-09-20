'use client';

export function PatientFlowSkeleton() {
  return (
    <div className="animate-pulse space-y-5" aria-hidden>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="h-5 w-40 rounded-lg bg-slate-200/80" />
          <div className="h-3.5 w-56 rounded-md bg-slate-100" />
        </div>
        <div className="flex gap-1.5">
          <div className="h-9 w-16 rounded-full bg-slate-100" />
          <div className="h-9 w-16 rounded-full bg-slate-100" />
          <div className="h-9 w-16 rounded-full bg-slate-100" />
          <div className="h-9 w-20 rounded-full bg-slate-100" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 laptop:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[62px] rounded-xl bg-slate-50 ring-1 ring-inset ring-slate-100" />
        ))}
      </div>
      <div className="relative h-[240px] overflow-hidden rounded-xl bg-gradient-to-b from-slate-50 to-white sm:h-[260px]">
        <div className="absolute inset-x-6 bottom-8 h-24 rounded-full bg-indigo-100/40 blur-2xl" />
        <div className="absolute inset-x-8 bottom-16 h-px bg-slate-200/80" />
        <div className="absolute inset-x-8 bottom-28 h-px bg-slate-100" />
        <div className="absolute inset-x-8 bottom-40 h-px bg-slate-100" />
        <svg
          className="absolute inset-x-6 bottom-10 h-36 w-[calc(100%-3rem)] text-indigo-200/70"
          viewBox="0 0 400 120"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            d="M0 80 C40 70 70 40 110 48 C150 56 170 90 210 78 C250 66 280 30 320 38 C360 46 380 70 400 60 V120 H0 Z"
            fill="currentColor"
            opacity="0.35"
          />
          <path
            d="M0 80 C40 70 70 40 110 48 C150 56 170 90 210 78 C250 66 280 30 320 38 C360 46 380 70 400 60"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}
