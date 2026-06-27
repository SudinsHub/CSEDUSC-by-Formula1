import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, isValid } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | undefined | null, fmt = 'MMM d, yyyy'): string {
  if (!dateStr) return '—';
  try {
    const d = parseISO(dateStr);
    return isValid(d) ? format(d, fmt) : '—';
  } catch {
    return '—';
  }
}

export function formatDateTime(dateStr: string | undefined | null): string {
  return formatDate(dateStr, 'MMM d, yyyy · h:mm a');
}

export function formatCurrency(amount: number | string): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(n || 0);
}

export function roleBadge(role: string): string {
  const map: Record<string, string> = {
    Administrator: 'Admin',
    ECMember: 'EC Member',
    GeneralStudent: 'Student',
  };
  return map[role] ?? role;
}

export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const e = error as Record<string, unknown>;
    if (e.response && typeof e.response === 'object') {
      const data = (e.response as Record<string, unknown>).data as Record<string, unknown> | undefined;
      if (data?.error) return String(data.error);
    }
    if (e.message) return String(e.message);
  }
  return 'An unexpected error occurred';
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    approved: 'bg-green-100 text-green-800',
    open: 'bg-green-100 text-green-800',
    scheduled: 'bg-blue-100 text-blue-800',
    upcoming: 'bg-blue-100 text-blue-800',
    pending: 'bg-yellow-100 text-yellow-800',
    closed: 'bg-gray-100 text-gray-700',
    completed: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-red-100 text-red-800',
    rejected: 'bg-red-100 text-red-800',
    revoked: 'bg-red-100 text-red-800',
    low: 'bg-gray-100 text-gray-700',
    normal: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  };
  return map[status.toLowerCase()] ?? 'bg-gray-100 text-gray-700';
}