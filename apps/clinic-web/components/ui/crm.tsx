import { cn, statusTone } from '@/lib/cn';

export function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5">
      <p className="text-sm font-medium tracking-normal text-slate-500">{label}</p>
      <p className="mt-2 text-kpi text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-caption text-slate-400">{hint}</p> : null}
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <h2 className="text-section-title text-slate-900">{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Badge({ children, status }: { children: React.ReactNode; status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-caption font-medium tracking-normal ring-1 ring-inset',
        statusTone(status),
      )}
    >
      {children}
    </span>
  );
}

export function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left font-sans text-table-cell">
        <thead>
          <tr className="border-b border-slate-100 text-table-head uppercase text-slate-400">
            {columns.map((c, i) => (
              <th key={`${i}-${c}`} className="whitespace-nowrap px-3 py-2.5 align-middle">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-slate-50 last:border-0">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="px-3 py-3 align-middle font-normal tracking-normal text-slate-700"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
