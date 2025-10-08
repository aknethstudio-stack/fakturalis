'use client';

import { useAuth, useSupabase } from '@/hooks/use-supabase';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/database';
import { useCallback, useEffect, useState } from 'react';
import { BsArrowClockwise, BsCheck, BsCloudDownload, BsExclamationTriangle, BsInfo, BsX } from 'react-icons/bs';

type Invoice = Database['public']['Tables']['invoices']['Row'];
type KSeFSubmission = Database['public']['Tables']['ksef_submissions']['Row'];

interface KSeFStatusProps {
  invoice: Invoice;
  onStatusUpdate?: (status: string) => void;
}

interface KSeFStatusInfo {
  status: string;
  processingDate?: string;
  description?: string;
  errors?: string[];
  referenceNumber?: string;
  upoDownloadUrl?: string;
}

export default function KSeFStatus({ invoice, onStatusUpdate }: KSeFStatusProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [submissions, setSubmissions] = useState<KSeFSubmission[]>([]);
  const [statusInfo, setStatusInfo] = useState<KSeFStatusInfo | null>(null);
  const { user } = useAuth();
  const supabase = useSupabase();

  // Load submissions for this invoice
  const loadSubmissions = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('ksef_submissions')
        .select('*')
        .eq('invoice_id', invoice.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSubmissions(data || []);
    } catch (error) {
      logger.error('Error loading KSeF submissions:', error);
    }
  }, [user, supabase, invoice.id]);

  // Check status with KSeF API
  const checkStatus = async () => {
    if (!invoice.ksef_reference_number) {
      setError('Brak numeru referencyjnego KSeF');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/ksef/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoice_id: invoice.id,
          reference_number: invoice.ksef_reference_number,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Wystąpił błąd podczas sprawdzania statusu');
      }

      setStatusInfo(result);

      // Update invoice status if changed
      if (result.status !== invoice.ksef_status) {
        const { error: updateError } = await supabase
          .from('invoices')
          .update({ ksef_status: result.status })
          .eq('id', invoice.id)
          .eq('owner_id', user?.id);

        if (updateError) {
          logger.error('Error updating invoice KSeF status:', updateError);
        } else {
          onStatusUpdate?.(result.status);
          logger.info('Invoice KSeF status updated', {
            invoiceId: invoice.id,
            oldStatus: invoice.ksef_status,
            newStatus: result.status,
          });
        }
      }

      // Reload submissions to get latest data
      await loadSubmissions();
    } catch (error) {
      logger.error('Error checking KSeF status:', error);
      setError(error instanceof Error ? error.message : 'Wystąpił błąd podczas sprawdzania statusu');
    } finally {
      setIsLoading(false);
    }
  };

  // Download UPO (official confirmation)
  const downloadUPO = async () => {
    if (!invoice.ksef_reference_number) {
      setError('Brak numeru referencyjnego KSeF');
      return;
    }

    try {
      const response = await fetch('/api/ksef/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoice_id: invoice.id,
          reference_number: invoice.ksef_reference_number,
          document_type: 'UPO',
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Wystąpił błąd podczas pobierania UPO');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `UPO_${invoice.number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      logger.info('UPO downloaded successfully', { invoiceId: invoice.id });
    } catch (error) {
      logger.error('Error downloading UPO:', error);
      setError(error instanceof Error ? error.message : 'Wystąpił błąd podczas pobierania UPO');
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'not_sent':
        return 'Niewysłana';
      case 'pending':
        return 'Oczekuje';
      case 'accepted':
        return 'Zaakceptowana';
      case 'rejected':
        return 'Odrzucona';
      case 'error':
        return 'Błąd';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <BsCheck className='h-5 w-5' />;
      case 'rejected':
      case 'error':
        return <BsX className='h-5 w-5' />;
      case 'pending':
        return <BsArrowClockwise className='h-5 w-5 animate-spin' />;
      default:
        return <BsInfo className='h-5 w-5' />;
    }
  };

  return (
    <div className='rounded-lg bg-white shadow'>
      <div className='px-4 py-5 sm:p-6'>
        <div className='mb-4 flex items-center justify-between'>
          <h3 className='text-lg font-medium text-gray-900'>Status KSeF</h3>
          {invoice.ksef_reference_number && (
            <button
              onClick={checkStatus}
              disabled={isLoading}
              className='inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'>
              <BsArrowClockwise className={cn('mr-2 h-4 w-4', isLoading && 'animate-spin')} />
              Odśwież status
            </button>
          )}
        </div>

        {/* Current Status */}
        <div className='mb-6'>
          <div className='flex items-center space-x-3'>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium',
                getStatusColor(invoice.ksef_status),
              )}>
              {getStatusIcon(invoice.ksef_status)}
              <span className='ml-2'>{getStatusLabel(invoice.ksef_status)}</span>
            </span>
            {invoice.ksef_reference_number && (
              <span className='text-sm text-gray-500'>Ref: {invoice.ksef_reference_number}</span>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className='mb-6 rounded-md bg-red-50 p-4'>
            <div className='flex'>
              <div className='flex-shrink-0'>
                <BsX className='h-5 w-5 text-red-400' />
              </div>
              <div className='ml-3'>
                <h3 className='text-sm font-medium text-red-800'>Błąd</h3>
                <div className='mt-2 text-sm text-red-700'>
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Details */}
        {statusInfo && (
          <div className='mb-6 rounded-lg bg-gray-50 p-4'>
            <h4 className='mb-3 text-sm font-medium text-gray-900'>Szczegóły statusu</h4>
            <div className='space-y-2 text-sm text-gray-600'>
              {statusInfo.processingDate && (
                <div>
                  <span className='font-medium'>Data przetworzenia:</span>{' '}
                  {new Date(statusInfo.processingDate).toLocaleString('pl-PL')}
                </div>
              )}
              {statusInfo.description && (
                <div>
                  <span className='font-medium'>Opis:</span> {statusInfo.description}
                </div>
              )}
              {statusInfo.errors && statusInfo.errors.length > 0 && (
                <div>
                  <span className='font-medium'>Błędy:</span>
                  <ul className='mt-1 list-inside list-disc'>
                    {statusInfo.errors.map((error, index) => (
                      <li key={index} className='text-red-600'>
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions for Accepted Invoices */}
        {invoice.ksef_status === 'accepted' && (
          <div className='mb-6'>
            <h4 className='mb-3 text-sm font-medium text-gray-900'>Dostępne akcje</h4>
            <div className='space-y-2'>
              <button
                onClick={downloadUPO}
                className='inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none'>
                <BsCloudDownload className='mr-2 h-4 w-4' />
                Pobierz UPO (potwierdzenie)
              </button>
            </div>
          </div>
        )}

        {/* Submission History */}
        {submissions.length > 0 && (
          <div>
            <h4 className='mb-3 text-sm font-medium text-gray-900'>Historia wysyłek</h4>
            <div className='space-y-3'>
              {submissions.map((submission) => (
                <div key={submission.id} className='rounded-lg border border-gray-200 p-3'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-3'>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                          getStatusColor(submission.status),
                        )}>
                        {getStatusIcon(submission.status)}
                        <span className='ml-1'>{getStatusLabel(submission.status)}</span>
                      </span>
                      {submission.submission_id && (
                        <span className='text-sm text-gray-500'>ID: {submission.submission_id}</span>
                      )}
                    </div>
                    <span className='text-xs text-gray-400'>
                      {new Date(submission.created_at).toLocaleString('pl-PL')}
                    </span>
                  </div>
                  {submission.reference_number && (
                    <div className='mt-2 text-xs text-gray-500'>Ref: {submission.reference_number}</div>
                  )}
                  {submission.error_message && (
                    <div className='mt-2 text-xs text-red-600'>Błąd: {submission.error_message}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Reference Number Warning */}
        {!invoice.ksef_reference_number && invoice.ksef_status === 'not_sent' && (
          <div className='rounded-md bg-yellow-50 p-4'>
            <div className='flex'>
              <div className='flex-shrink-0'>
                <BsExclamationTriangle className='h-5 w-5 text-yellow-400' />
              </div>
              <div className='ml-3'>
                <h3 className='text-sm font-medium text-yellow-800'>Faktura nie została wysłana</h3>
                <div className='mt-2 text-sm text-yellow-700'>
                  <p>Ta faktura nie została jeszcze wysłana do systemu KSeF.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
