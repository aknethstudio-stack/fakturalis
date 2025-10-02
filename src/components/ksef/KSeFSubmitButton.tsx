/**
 * KSeF Submit Button Component
 * Button for submitting invoices to Polish National e-Invoice System
 */

'use client';

import type { KSeFSubmissionStatus } from '@/types/database';
import { clsx } from 'clsx';
import { useState } from 'react';

interface KSeFSubmitButtonProps {
  invoiceId: string;
  currentStatus: KSeFSubmissionStatus;
  onSubmit?: (result: { success: boolean; error?: string }) => void;
  className?: string;
}

export default function KSeFSubmitButton({ invoiceId, currentStatus, onSubmit, className }: KSeFSubmitButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDisabled = currentStatus === 'accepted' || currentStatus === 'pending' || isSubmitting;

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/ksef/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoiceId }),
      });

      const result = await response.json();

      if (result.success) {
        onSubmit?.({ success: true });
      } else {
        onSubmit?.({ success: false, error: result.error });
      }
    } catch (error) {
      onSubmit?.({
        success: false,
        error: error instanceof Error ? error.message : 'Nieznany błąd',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getButtonText = () => {
    if (isSubmitting) return 'Wysyłanie...';
    if (currentStatus === 'accepted') return 'Wysłano do KSeF';
    if (currentStatus === 'pending') return 'Przetwarzanie...';
    if (currentStatus === 'rejected' || currentStatus === 'error') return 'Wyślij ponownie';
    return 'Wyślij do KSeF';
  };

  const getButtonIcon = () => {
    if (isSubmitting) return '⏳';
    if (currentStatus === 'accepted') return '✅';
    if (currentStatus === 'pending') return '⏳';
    if (currentStatus === 'rejected' || currentStatus === 'error') return '🔄';
    return '📤';
  };

  return (
    <button
      type='button'
      onClick={handleSubmit}
      disabled={isDisabled}
      className={clsx(
        'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
        {
          'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2':
            !isDisabled && (currentStatus === 'not_sent' || currentStatus === 'rejected' || currentStatus === 'error'),
          'cursor-not-allowed bg-gray-100 text-gray-500': isDisabled,
          'bg-green-100 text-green-700': currentStatus === 'accepted',
          'bg-yellow-100 text-yellow-700': currentStatus === 'pending',
        },
        className,
      )}
      title={
        currentStatus === 'accepted'
          ? 'Faktura została już pomyślnie wysłana do KSeF'
          : currentStatus === 'pending'
            ? 'Faktura jest obecnie przetwarzana przez KSeF'
            : 'Wyślij fakturę do Krajowego Systemu e-Faktur'
      }>
      <span>{getButtonIcon()}</span>
      <span>{getButtonText()}</span>
    </button>
  );
}
