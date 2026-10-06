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
    <div className="rounded-2xl border border-line bg-card p-5 shadow-card">
      <p className="text-sm font-medium tracking-normal text-fg-muted">{label}</p>
      <p className="mt-2 text-kpi text-fg">{value}</p>
      {hint ? <p className="mt-1 text-caption text-fg-subtle">{hint}</p> : null}
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
    <section className={cn('rounded-2xl border border-line bg-card shadow-card', className)}>
      <div className="flex items-center justify-between gap-3 border-b border-line/70 px-5 py-4">
        <h2 className="text-section-title text-fg">{title}</h2>
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
          <tr className="border-b border-line/70 text-table-head uppercase text-fg-subtle">
            {columns.map((c, i) => (
              <th key={`${i}-${c}`} className="whitespace-nowrap px-3 py-2.5 align-middle">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-line/50 transition-colors last:border-0 hover:bg-hover/60"
            >
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="px-3 py-3 align-middle font-normal tracking-normal text-fg/80"
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
