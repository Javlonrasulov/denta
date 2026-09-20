import clsx from 'clsx';

export function cn(...inputs: Array<string | false | null | undefined>) {
  return clsx(inputs);
}

export function statusTone(status: string): string {
  switch (status) {
    case 'upcoming':
    case 'available':
    case 'paid':
    case 'active':
    case 'completed':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-600/15';
    case 'occupied':
    case 'pending':
    case 'partial':
    case 'treatment':
    case 'follow_up':
      return 'bg-amber-50 text-amber-700 ring-amber-600/15';
    case 'cancelled':
    case 'maintenance':
    case 'overdue':
    case 'debt':
    case 'inactive':
      return 'bg-rose-50 text-rose-700 ring-rose-600/15';
    default:
      return 'bg-slate-100 text-slate-600 ring-slate-500/10';
  }
}
