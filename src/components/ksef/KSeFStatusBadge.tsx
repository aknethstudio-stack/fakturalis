/**
 * KSeF Status Badge Component
 * Displays current KSeF submission status for invoices
 */

import type { KSeFSubmissionStatus } from '@/types/database';
import { clsx } from 'clsx';

interface KSeFStatusBadgeProps {
  status: KSeFSubmissionStatus;
  className?: string;
}

const statusConfig = {
  not_sent: {
    label: 'Nie wysłano',
    className: 'bg-gray-100 text-gray-800',
    icon: '⏸️',
  },
  pending: {
    label: 'Przetwarzanie',
    className: 'bg-yellow-100 text-yellow-800',
    icon: '⏳',
  },
  accepted: {
    label: 'Zaakceptowano',
    className: 'bg-green-100 text-green-800',
    icon: '✅',
  },
  rejected: {
    label: 'Odrzucono',
    className: 'bg-red-100 text-red-800',
    icon: '❌',
  },
  error: {
    label: 'Błąd',
    className: 'bg-red-100 text-red-800',
    icon: '⚠️',
  },
} as const;

export default function KSeFStatusBadge({ status, className }: KSeFStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
        config.className,
        className,
      )}
      title={`Status KSeF: ${config.label}`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
