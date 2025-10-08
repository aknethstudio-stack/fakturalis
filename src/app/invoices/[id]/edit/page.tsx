'use client';

import InvoiceForm from '@/components/forms/InvoiceForm';
import { useAuth, useSupabase } from '@/hooks/use-supabase';
import type { Database } from '@/types/database';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { BsArrowLeft } from 'react-icons/bs';

type Invoice = Database['public']['Tables']['invoices']['Row'];
type InvoiceItem = Database['public']['Tables']['invoice_items']['Row'];
type Client = Database['public']['Tables']['clients']['Row'];

interface InvoiceWithRelations extends Invoice {
  invoice_items: InvoiceItem[];
  clients: Client;
}

interface EditInvoicePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditInvoicePage({ params }: EditInvoicePageProps) {
  const [invoice, setInvoice] = useState<InvoiceWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [invoiceId, setInvoiceId] = useState<string>('');
  const { user } = useAuth();
  const supabase = useSupabase();
  const router = useRouter();

  const loadInvoice = useCallback(async () => {
    if (!user || !invoiceId) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('invoices')
        .select(
          `
          *,
          invoice_items (*),
          clients (*)
        `,
        )
        .eq('id', invoiceId)
        .eq('owner_id', user.id)
        .single();

      if (error) throw error;

      setInvoice(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Nie udało się załadować faktury');
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase, invoiceId]);

  const handleSubmit = () => {
    // Redirect back to invoice details
    router.push(`/invoices/${invoiceId}`);
  };

  const handleCancel = () => {
    // Redirect back to invoice details
    router.push(`/invoices/${invoiceId}`);
  };

  useEffect(() => {
    // Resolve params Promise and set invoice ID
    params.then((resolvedParams) => {
      setInvoiceId(resolvedParams.id);
    });
  }, [params]);

  useEffect(() => {
    loadInvoice();
  }, [loadInvoice]);

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-50 py-8'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='animate-pulse'>
            <div className='mb-6 h-8 w-1/4 rounded bg-gray-200'></div>
            <div className='rounded-lg bg-white p-6 shadow'>
              <div className='mb-4 h-6 w-1/3 rounded bg-gray-200'></div>
              <div className='space-y-3'>
                <div className='h-4 w-3/4 rounded bg-gray-200'></div>
                <div className='h-4 w-1/2 rounded bg-gray-200'></div>
                <div className='h-4 w-2/3 rounded bg-gray-200'></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className='min-h-screen bg-gray-50 py-8'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='rounded-md bg-red-50 p-4'>
            <div className='text-sm text-red-700'>{error || 'Nie znaleziono faktury'}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'>
        <div className='mb-8'>
          <div className='flex items-center space-x-4'>
            <Link
              href={`/invoices/${invoiceId}`}
              className='inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700'>
              <BsArrowLeft className='mr-1 h-4 w-4' />
              Powrót do faktury
            </Link>
            <h1 className='text-2xl font-bold text-gray-900'>Edytuj fakturę {invoice.number}</h1>
          </div>
        </div>

        <div className='rounded-lg bg-white shadow'>
          <InvoiceForm invoice={invoice} onSuccess={handleSubmit} onCancel={handleCancel} />
        </div>
      </div>
    </div>
  );
}
