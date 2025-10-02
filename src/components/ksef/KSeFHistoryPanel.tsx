/**
 * KSeF History Panel Component
 * Displays submission history and UPO downloads for invoices
 */

'use client';

import type { KSeFSubmission } from '@/types/database';
import { clsx } from 'clsx';
import { useEffect, useState } from 'react';
import { z } from 'zod';

// Zod schema for KSeF reference number validation
const ksefReferenceSchema = z
  .string()
  .min(1, 'Reference number nie może być pusty')
  .max(100, 'Reference number zbyt długi')
  .regex(/^[A-Za-z0-9\-_]+$/, 'Reference number może zawierać tylko litery, cyfry, myślniki i podkreślenia');

interface KSeFHistoryPanelProps {
  invoiceId: string;
  className?: string;
}

export default function KSeFHistoryPanel({ invoiceId, className }: KSeFHistoryPanelProps) {
  const [submissions, setSubmissions] = useState<KSeFSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, [invoiceId]);

  const fetchSubmissions = async () => {
    try {
      // This would be implemented with your Supabase client
      // const { data } = await supabase
      //   .from('ksef_submissions')
      //   .select('*')
      //   .eq('invoice_id', invoiceId)
      //   .order('created_at', { ascending: false });

      // For now, mock data
      setSubmissions([]);
    } catch (error) {
      console.error('Failed to fetch KSeF submissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadUPO = async (referenceNumber: string) => {
    try {
      // Validate and sanitize reference number with Zod
      const validatedRef = ksefReferenceSchema.parse(referenceNumber);

      const response = await fetch(`/api/ksef/download?referenceNumber=${encodeURIComponent(validatedRef)}`);

      if (response.ok) {
        const blob = await response.blob();

        // Modern approach using URL.createObjectURL without DOM manipulation
        const url = URL.createObjectURL(blob);
        const filename = `UPO_${validatedRef}.xml`;

        // Use window.open for file download (more secure than appendChild)
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';

        // Trigger download without DOM insertion
        const event = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window,
        });
        link.dispatchEvent(event);

        // Clean up
        setTimeout(() => URL.revokeObjectURL(url), 100);
      } else {
        const result = await response.json();
        alert(`Błąd pobierania UPO: ${result.error}`);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        alert(`Nieprawidłowy numer referencyjny: ${error.issues[0]?.message}`);
      } else {
        alert(`Błąd pobierania UPO: ${error instanceof Error ? error.message : 'Nieznany błąd'}`);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pl-PL');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return '✅';
      case 'rejected':
        return '❌';
      case 'pending':
        return '⏳';
      case 'error':
        return '⚠️';
      default:
        return '📄';
    }
  };

  if (isLoading) {
    return (
      <div className={clsx('rounded-lg border p-4', className)}>
        <div className='animate-pulse'>
          <div className='mb-3 h-4 w-1/4 rounded bg-gray-200'></div>
          <div className='space-y-2'>
            <div className='h-3 w-full rounded bg-gray-200'></div>
            <div className='h-3 w-3/4 rounded bg-gray-200'></div>
          </div>
        </div>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className={clsx('rounded-lg border bg-gray-50 p-4', className)}>
        <h3 className='mb-2 text-sm font-medium text-gray-900'>Historia KSeF</h3>
        <p className='text-sm text-gray-500'>Brak submisji do KSeF dla tej faktury.</p>
      </div>
    );
  }

  return (
    <div className={clsx('rounded-lg border', className)}>
      <div className='border-b bg-gray-50 px-4 py-3'>
        <h3 className='text-sm font-medium text-gray-900'>Historia KSeF</h3>
      </div>

      <div className='divide-y'>
        {submissions.map((submission) => (
          <div key={submission.id} className='p-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <span className='text-lg'>{getStatusIcon(submission.status)}</span>
                <div>
                  <p className='text-sm font-medium text-gray-900'>Submisja {submission.submission_id}</p>
                  <p className='text-xs text-gray-500'>{formatDate(submission.created_at)}</p>
                </div>
              </div>

              <div className='flex items-center gap-2'>
                {submission.status === 'accepted' && submission.upo_number && (
                  <button
                    onClick={() => handleDownloadUPO(submission.reference_number!)}
                    className='text-xs text-blue-600 underline hover:text-blue-800'>
                    Pobierz UPO
                  </button>
                )}

                <button
                  onClick={() => setExpandedSubmission(expandedSubmission === submission.id ? null : submission.id)}
                  className='text-xs text-gray-500 hover:text-gray-700'>
                  {expandedSubmission === submission.id ? 'Ukryj' : 'Szczegóły'}
                </button>
              </div>
            </div>

            {expandedSubmission === submission.id && (
              <div className='mt-3 space-y-1 border-t pt-3 text-xs text-gray-600'>
                {submission.reference_number && (
                  <p>
                    <strong>Numer referencyjny:</strong> {submission.reference_number}
                  </p>
                )}
                {submission.processing_code && (
                  <p>
                    <strong>Kod przetwarzania:</strong> {submission.processing_code}
                  </p>
                )}
                {submission.processing_description && (
                  <p>
                    <strong>Opis:</strong> {submission.processing_description}
                  </p>
                )}
                {submission.error_message && (
                  <p className='text-red-600'>
                    <strong>Błąd:</strong> {submission.error_message}
                  </p>
                )}
                {submission.acquisition_timestamp && (
                  <p>
                    <strong>Data akceptacji:</strong> {formatDate(submission.acquisition_timestamp)}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
