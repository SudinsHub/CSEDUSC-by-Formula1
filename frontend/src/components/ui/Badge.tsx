import { cn, statusColor } from '@/lib/utils';

interface BadgeProps {
  label: string;
  status?: string;
  className?: string;
}

export default function Badge({ label, status, className }: BadgeProps) {
  return (
    <span className={cn('badge', status ? statusColor(status) : 'bg-gray-100 text-gray-700', className)}>
      {label}
    </span>
  );
}
