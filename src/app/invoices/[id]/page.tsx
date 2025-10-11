'use client';

import KSeFStatus from '@/components/ksef/KSeFStatus';
import KSeFSubmission from '@/components/ksef/KSeFSubmission';
import { useAuth, useSupabase } from '@/hooks/use-supabase';
import { downloadInvoicePDF, type PDFGenerationOptions } from '@/lib/pdf-generator';
import type { Database } from '@/types/database';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { BsArrowLeft, BsCalendar, BsCreditCard, BsFileText, BsPencil, BsTrash } from 'react-icons/bs';

type Invoice = Database['public']['Tables']['invoices']['Row'];
type InvoiceItem = Database['public']['Tables']['invoice_items']['Row'];
type Client = Database['public']['Tables']['clients']['Row'];

interface InvoiceWithRelations extends Invoice {
  invoice_items: InvoiceItem[];
  clients: Client;
}

interface InvoiceDetailsProps {
  invoiceId: string;
}

function InvoiceDetails({ invoiceId }: InvoiceDetailsProps) {
  const [invoice, setInvoice] = useState<InvoiceWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string>('');
  const { user } = useAuth();
  const supabase = useSupabase();
  const router = useRouter();

  const loadInvoice = useCallback(async () => {
    if (!user) return;

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

  const handleDelete = async () => {
    if (!invoice || !user) return;
    if (!confirm('Czy na pewno chcesz usunąć tę fakturę? Ta operacja jest nieodwracalna.')) return;

    try {
      setIsDeleting(true);
      setError('');

      // Delete invoice items first (due to foreign key constraint)
      const { error: itemsError } = await supabase.from('invoice_items').delete().eq('invoice_id', invoice.id);

      if (itemsError) throw itemsError;

      // Delete invoice
      const { error: invoiceError } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoice.id)
        .eq('owner_id', user.id);

      if (invoiceError) throw invoiceError;

      if (typeof window !== 'undefined') {
        router.push('/invoices');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Nie udało się usunąć faktury');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoice) return;

    try {
      const options: PDFGenerationOptions = {
        companyInfo: {
          name: 'Twoja Firma Sp. z o.o.',
          address_line1: 'ul. Przykładowa 123',
          city: 'Warszawa',
          postal_code: '00-001',
          vat_id: 'PL1234567890',
          phone: '+48 123 456 789',
          email: 'kontakt@twojafirma.pl',
        },
      };

      await downloadInvoicePDF(invoice, options);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Nie udało się wygenerować PDF');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'issued':
        return 'bg-indigo-100 text-indigo-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'voided':
      case 'cancelled':
        return 'bg-gray-100 text-gray-500';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Szkic';
      case 'issued':
        return 'Wystawiona';
      case 'sent':
        return 'Wysłana';
      case 'paid':
        return 'Opłacona';
      case 'overdue':
        return 'Przeterminowana';
      case 'voided':
        return 'Anulowana';
      case 'cancelled':
        return 'Odwołana';
      default:
        return status;
    }
  };

  const getVATRateLabel = (rate: number) => {
    switch (rate) {
      case 0:
        return 'zwolnione';
      case 5:
        return '5%';
      case 8:
        return '8%';
      case 23:
        return '23%';
      default:
        return `${rate}%`;
    }
  };

  const getUnitLabel = (unit: string) => {
    switch (unit) {
      case 'pcs':
        return 'szt.';
      case 'hours':
        return 'godz.';
      case 'days':
        return 'dni';
      case 'kg':
        return 'kg';
      case 'm':
        return 'm';
      case 'm2':
        return 'm²';
      case 'm3':
        return 'm³';
      case 'service':
        return 'usł.';
      default:
        return unit;
    }
  };

  const handleStatusUpdate = (newStatus: string) => {
    if (invoice) {
      setInvoice({
        ...invoice,
        ksef_status: newStatus as 'not_sent' | 'pending' | 'accepted' | 'rejected' | 'error',
      });
    }
  };

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

  // Use database values directly instead of recalculating
  const totals = {
    totalNet: invoice.subtotal_net,
    totalVat: invoice.total_vat,
    totalGross: invoice.total_gross,
  };

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <Link
                href='/invoices'
                className='inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700'>
                <BsArrowLeft className='mr-1 h-4 w-4' />
                Powrót do listy
              </Link>
              <h1 className='text-2xl font-bold text-gray-900'>Faktura {invoice.number}</h1>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(invoice.status)}`}>
                {getStatusLabel(invoice.status)}
              </span>
            </div>
            <div className='flex items-center space-x-3'>
              <button
                onClick={handleDownloadPDF}
                className='inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none'>
                <BsFileText className='mr-2 h-4 w-4' />
                Pobierz PDF
              </button>
              <Link
                href={`/invoices/${invoice.id}/edit`}
                className='inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none'>
                <BsPencil className='mr-2 h-4 w-4' />
                Edytuj
              </Link>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className='inline-flex items-center rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'>
                <BsTrash className='mr-2 h-4 w-4' />
                {isDeleting ? 'Usuwanie...' : 'Usuń'}
              </button>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
          {/* Main Content */}
          <div className='space-y-8 lg:col-span-2'>
            {/* Invoice Details */}
            <div className='rounded-lg bg-white shadow'>
              <div className='border-b border-gray-200 px-6 py-4'>
                <h2 className='text-lg font-medium text-gray-900'>Szczegóły faktury</h2>
              </div>
              <div className='px-6 py-4'>
                <div className='grid grid-cols-2 gap-6'>
                  <div>
                    <div className='text-sm font-medium text-gray-500'>Numer faktury</div>
                    <div className='mt-1 text-sm text-gray-900'>{invoice.number}</div>
                  </div>
                  <div>
                    <div className='text-sm font-medium text-gray-500'>Data wystawienia</div>
                    <div className='mt-1 flex items-center text-sm text-gray-900'>
                      <BsCalendar className='mr-1 h-4 w-4 text-gray-400' />
                      {new Date(invoice.issue_date).toLocaleDateString('pl-PL')}
                    </div>
                  </div>
                  <div>
                    <div className='text-sm font-medium text-gray-500'>Termin płatności</div>
                    <div className='mt-1 flex items-center text-sm text-gray-900'>
                      <BsCreditCard className='mr-1 h-4 w-4 text-gray-400' />
                      {new Date(invoice.due_date).toLocaleDateString('pl-PL')}
                    </div>
                  </div>
                  <div>
                    <div className='text-sm font-medium text-gray-500'>Waluta</div>
                    <div className='mt-1 text-sm text-gray-900'>{invoice.currency}</div>
                  </div>
                </div>
                {invoice.notes && (
                  <div className='mt-6'>
                    <div className='text-sm font-medium text-gray-500'>Uwagi</div>
                    <div className='mt-1 text-sm whitespace-pre-wrap text-gray-900'>{invoice.notes}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Client Information */}
            <div className='rounded-lg bg-white shadow'>
              <div className='border-b border-gray-200 px-6 py-4'>
                <h2 className='text-lg font-medium text-gray-900'>Klient</h2>
              </div>
              <div className='px-6 py-4'>
                <div className='space-y-3'>
                  <div>
                    <div className='text-sm font-medium text-gray-500'>Nazwa</div>
                    <div className='mt-1 text-sm text-gray-900'>{invoice.clients.name}</div>
                  </div>
                  {invoice.clients.vat_id && (
                    <div>
                      <div className='text-sm font-medium text-gray-500'>NIP</div>
                      <div className='mt-1 text-sm text-gray-900'>{invoice.clients.vat_id}</div>
                    </div>
                  )}
                  {(invoice.clients.address_line1 || invoice.clients.city) && (
                    <div>
                      <div className='text-sm font-medium text-gray-500'>Adres</div>
                      <div className='mt-1 text-sm text-gray-900'>
                        {invoice.clients.address_line1 && <div>{invoice.clients.address_line1}</div>}
                        {invoice.clients.address_line2 && <div>{invoice.clients.address_line2}</div>}
                        {(invoice.clients.postal_code || invoice.clients.city) && (
                          <div>
                            {invoice.clients.postal_code} {invoice.clients.city}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {(invoice.clients.email || invoice.clients.phone) && (
                    <div className='flex space-x-6'>
                      {invoice.clients.email && (
                        <div>
                          <div className='text-sm font-medium text-gray-500'>Email</div>
                          <div className='mt-1 text-sm text-gray-900'>{invoice.clients.email}</div>
                        </div>
                      )}
                      {invoice.clients.phone && (
                        <div>
                          <div className='text-sm font-medium text-gray-500'>Telefon</div>
                          <div className='mt-1 text-sm text-gray-900'>{invoice.clients.phone}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Invoice Items */}
            <div className='rounded-lg bg-white shadow'>
              <div className='border-b border-gray-200 px-6 py-4'>
                <h2 className='text-lg font-medium text-gray-900'>Pozycje faktury</h2>
              </div>
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                        Nazwa
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                        Ilość
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                        Cena netto
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                        VAT
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                        Wartość netto
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                        Wartość VAT
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                        Wartość brutto
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-200 bg-white'>
                    {invoice.invoice_items.map((item) => {
                      // Use database values directly
                      const itemTotals = {
                        netAmount: item.line_net,
                        vatAmount: item.line_vat,
                        grossAmount: item.line_gross,
                      };

                      return (
                        <tr key={item.id}>
                          <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-900'>
                            <div>
                              <div className='font-medium'>{item.name}</div>
                            </div>
                          </td>
                          <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-900'>
                            {item.quantity} {getUnitLabel(item.unit)}
                          </td>
                          <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-900'>
                            {item.unit_price.toFixed(2)} PLN
                          </td>
                          <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-900'>
                            {getVATRateLabel(item.vat_rate)}
                          </td>
                          <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-900'>
                            {itemTotals.netAmount.toFixed(2)} PLN
                          </td>
                          <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-900'>
                            {itemTotals.vatAmount.toFixed(2)} PLN
                          </td>
                          <td className='px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900'>
                            {itemTotals.grossAmount.toFixed(2)} PLN
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className='border-t border-gray-200 bg-gray-50 px-6 py-4'>
                <div className='flex justify-end space-x-8 text-sm'>
                  <div>
                    <span className='text-gray-500'>Suma netto:</span>
                    <span className='ml-2 font-medium'>{totals.totalNet.toFixed(2)} PLN</span>
                  </div>
                  <div>
                    <span className='text-gray-500'>Suma VAT:</span>
                    <span className='ml-2 font-medium'>{totals.totalVat.toFixed(2)} PLN</span>
                  </div>
                  <div>
                    <span className='text-gray-500'>Suma brutto:</span>
                    <span className='ml-2 text-lg font-semibold'>{totals.totalGross.toFixed(2)} PLN</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className='space-y-8'>
            {/* KSeF Status */}
            <KSeFStatus invoice={invoice} onStatusUpdate={handleStatusUpdate} />

            {/* KSeF Submission (only for issued invoices) */}
            {(invoice.status === 'issued' || invoice.status === 'sent') && (
              <KSeFSubmission invoice={invoice} onSuccess={loadInvoice} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main page component that receives params from Next.js
interface InvoicePageProps {
  params: Promise<{
    id: string;
  }>;
}

function InvoicePage({ params }: InvoicePageProps) {
  const [invoiceId, setInvoiceId] = useState<string>('');

  useEffect(() => {
    params.then((resolvedParams) => {
      setInvoiceId(resolvedParams.id);
    });
  }, [params]);

  if (!invoiceId) {
    return (
      <div className='min-h-screen bg-gray-50 py-8'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='animate-pulse'>
            <div className='mb-6 h-8 w-1/4 rounded bg-gray-200'></div>
            <div className='rounded-lg bg-white p-6 shadow'>
              <div className='mb-4 h-6 w-1/3 rounded bg-gray-200'></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <InvoiceDetails invoiceId={invoiceId} />;
}

export default InvoicePage;
