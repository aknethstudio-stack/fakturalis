'use client';

import { useAuth, useSupabase } from '@/hooks/use-supabase';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { ksefSubmissionSchema, type KSeFSubmission } from '@/lib/validations/invoice';
import type { Database } from '@/types/database';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { BsCheck, BsCloudUpload, BsExclamationTriangle, BsInfo, BsX } from 'react-icons/bs';

type Invoice = Database['public']['Tables']['invoices']['Row'];

interface KSeFSubmissionProps {
  invoice: Invoice;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function KSeFSubmission({ invoice, onSuccess, onCancel }: KSeFSubmissionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [submitSuccess, setSubmitSuccess] = useState<string>('');
  const { user } = useAuth();
  const supabase = useSupabase();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<KSeFSubmission>({
    resolver: zodResolver(ksefSubmissionSchema),
    defaultValues: {
      invoice_id: invoice.id,
      environment: 'TEST' as const,
      force_resend: false,
    },
  });

  const onSubmit = async (data: KSeFSubmission) => {
    if (!user) {
      setSubmitError('Nie jesteś zalogowany');
      return;
    }

    setIsLoading(true);
    setSubmitError('');
    setSubmitSuccess('');

    try {
      // First check if KSeF configuration exists
      const { data: ksefConfig, error: configError } = await supabase
        .from('ksef_config')
        .select('*')
        .eq('owner_id', user.id)
        .eq('environment', data.environment)
        .single();

      if (configError || !ksefConfig) {
        throw new Error(
          `Brak konfiguracji KSeF dla środowiska ${data.environment}. Skonfiguruj najpierw certyfikaty w ustawieniach.`,
        );
      }

      // Check if invoice is already submitted and accepted (unless force_resend)
      if (!data.force_resend && invoice.ksef_status === 'accepted') {
        throw new Error(
          'Faktura została już zaakceptowana w KSeF. Użyj opcji "Wymuś ponowne wysłanie" aby wysłać ponownie.',
        );
      }

      // Submit to KSeF API
      const response = await fetch('/api/ksef/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoice_id: data.invoice_id,
          environment: data.environment,
          force_resend: data.force_resend,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Wystąpił błąd podczas wysyłania do KSeF');
      }

      setSubmitSuccess(
        result.reference_number
          ? `Faktura została wysłana do KSeF. Numer referencyjny: ${result.reference_number}`
          : 'Faktura została wysłana do KSeF',
      );

      logger.info('Invoice submitted to KSeF successfully', {
        invoiceId: invoice.id,
        environment: data.environment,
        referenceNumber: result.reference_number,
      });

      // Wait a moment before calling onSuccess to show the success message
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (error) {
      logger.error('Error submitting invoice to KSeF:', error);
      setSubmitError(error instanceof Error ? error.message : 'Wystąpił błąd podczas wysyłania do KSeF');
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit = invoice.status !== 'draft' && invoice.ksef_status !== 'pending';

  return (
    <div className='rounded-lg bg-white shadow'>
      <div className='px-4 py-5 sm:p-6'>
        <h3 className='mb-4 text-lg font-medium text-gray-900'>Wysyłka do KSeF</h3>

        {/* Invoice Info */}
        <div className='mb-6 rounded-lg bg-gray-50 p-4'>
          <h4 className='mb-2 text-sm font-medium text-gray-900'>Informacje o fakturze</h4>
          <div className='space-y-1 text-sm text-gray-600'>
            <div>Numer: {invoice.number}</div>
            <div>Status: {invoice.status}</div>
            <div>Status KSeF: {invoice.ksef_status}</div>
            <div>
              Kwota: {invoice.total_gross.toFixed(2)} {invoice.currency}
            </div>
            {invoice.ksef_reference_number && <div>Numer referencyjny KSeF: {invoice.ksef_reference_number}</div>}
          </div>
        </div>

        {/* Warnings */}
        {!canSubmit && (
          <div className='mb-6 rounded-md bg-yellow-50 p-4'>
            <div className='flex'>
              <div className='flex-shrink-0'>
                <BsExclamationTriangle className='h-5 w-5 text-yellow-400' />
              </div>
              <div className='ml-3'>
                <h3 className='text-sm font-medium text-yellow-800'>Uwaga</h3>
                <div className='mt-2 text-sm text-yellow-700'>
                  {invoice.status === 'draft' && (
                    <p>Faktura musi być wystawiona (nie może być szkicem) aby można było ją wysłać do KSeF.</p>
                  )}
                  {invoice.ksef_status === 'pending' && (
                    <p>Faktura jest obecnie w trakcie przetwarzania w KSeF. Sprawdź status później.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {submitSuccess && (
          <div className='mb-6 rounded-md bg-green-50 p-4'>
            <div className='flex'>
              <div className='flex-shrink-0'>
                <BsCheck className='h-5 w-5 text-green-400' />
              </div>
              <div className='ml-3'>
                <h3 className='text-sm font-medium text-green-800'>Sukces</h3>
                <div className='mt-2 text-sm text-green-700'>
                  <p>{submitSuccess}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {submitError && (
          <div className='mb-6 rounded-md bg-red-50 p-4'>
            <div className='flex'>
              <div className='flex-shrink-0'>
                <BsX className='h-5 w-5 text-red-400' />
              </div>
              <div className='ml-3'>
                <h3 className='text-sm font-medium text-red-800'>Błąd</h3>
                <div className='mt-2 text-sm text-red-700'>
                  <p>{submitError}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
          {/* Environment Selection */}
          <div>
            <label htmlFor='environment' className='block text-sm font-medium text-gray-700'>
              Środowisko KSeF <span className='text-red-500'>*</span>
            </label>
            <select
              {...register('environment')}
              className={cn(
                'mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm',
                errors.environment
                  ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
              )}>
              <option value='TEST'>Testowe</option>
              <option value='PROD'>Produkcyjne</option>
            </select>
            {errors.environment && <p className='mt-1 text-sm text-red-600'>{errors.environment.message}</p>}
            <p className='mt-1 text-sm text-gray-500'>
              Wybierz środowisko testowe do sprawdzenia funkcjonalności lub produkcyjne do rzeczywistej wysyłki.
            </p>
          </div>

          {/* Force Resend Option */}
          {(invoice.ksef_status === 'accepted' || invoice.ksef_status === 'rejected') && (
            <div className='flex items-start'>
              <div className='flex h-5 items-center'>
                <input
                  {...register('force_resend')}
                  type='checkbox'
                  className='h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
                />
              </div>
              <div className='ml-3 text-sm'>
                <label htmlFor='force_resend' className='font-medium text-gray-700'>
                  Wymuś ponowne wysłanie
                </label>
                <p className='text-gray-500'>
                  Wyślij fakturę ponownie nawet jeśli została już przetworzona przez KSeF.
                </p>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className='rounded-md bg-blue-50 p-4'>
            <div className='flex'>
              <div className='flex-shrink-0'>
                <BsInfo className='h-5 w-5 text-blue-400' />
              </div>
              <div className='ml-3'>
                <h3 className='text-sm font-medium text-blue-800'>Informacja</h3>
                <div className='mt-2 text-sm text-blue-700'>
                  <ul className='list-inside list-disc space-y-1'>
                    <li>Wysyłka faktury do KSeF może potrwać kilka minut</li>
                    <li>Status zostanie automatycznie zaktualizowany po przetworzeniu</li>
                    <li>W przypadku błędów sprawdź konfigurację certyfikatów w ustawieniach</li>
                    <li>Środowisko testowe służy do sprawdzenia działania bez skutków prawnych</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className='flex justify-end space-x-3 border-t border-gray-200 pt-6'>
            <button
              type='button'
              onClick={onCancel}
              className='rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none'>
              Anuluj
            </button>
            <button
              type='submit'
              disabled={isLoading || !canSubmit}
              className='flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'>
              {isLoading ? (
                <>
                  <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
                  Wysyłanie...
                </>
              ) : (
                <>
                  <BsCloudUpload className='mr-2 h-4 w-4' />
                  Wyślij do KSeF
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
