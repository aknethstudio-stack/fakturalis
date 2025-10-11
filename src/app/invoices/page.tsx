'use client';

import { useAuth, useSupabase } from '@/hooks/use-supabase';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { invoiceSearchSchema, type InvoiceSearch } from '@/lib/validations/invoice';
import type { Database } from '@/types/database';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { BsCalendar, BsClock, BsEye, BsFileText, BsPencil, BsPlus, BsSearch, BsTrash, BsX } from 'react-icons/bs';

type InvoiceWithClient = Database['public']['Tables']['invoices']['Row'] & {
  clients: Database['public']['Tables']['clients']['Row'] | null;
};

const ITEMS_PER_PAGE = 20;

const STATUS_LABELS = {
  DRAFT: 'Szkic',
  ISSUED: 'Wystawiona',
  SENT: 'Wysłana',
  PAID: 'Opłacona',
  OVERDUE: 'Przeterminowana',
  CANCELLED: 'Anulowana',
} as const;

const KSEF_STATUS_LABELS = {
  NOT_SENT: 'Niewysłana',
  PENDING: 'Oczekuje',
  ACCEPTED: 'Zaakceptowana',
  REJECTED: 'Odrzucona',
  ERROR: 'Błąd',
} as const;

const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-800',
  ISSUED: 'bg-blue-100 text-blue-800',
  SENT: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  OVERDUE: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
} as const;

const KSEF_STATUS_COLORS = {
  NOT_SENT: 'bg-gray-100 text-gray-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  ERROR: 'bg-red-100 text-red-800',
} as const;

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceWithClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const { user } = useAuth();
  const supabase = useSupabase();
  const _router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors: _errors },
  } = useForm<InvoiceSearch>({
    resolver: zodResolver(invoiceSearchSchema),
    defaultValues: {
      page: 1,
      limit: ITEMS_PER_PAGE,
    },
  });

  const watchedValues = watch();

  const loadInvoices = useCallback(
    async (searchParams: InvoiceSearch = { page: 1, limit: ITEMS_PER_PAGE }) => {
      if (!user) return;

      setIsLoading(true);
      setError('');

      try {
        let query = supabase
          .from('invoices')
          .select(
            `
          *,
          clients (
            id,
            name,
            vat_id
          )
        `,
            { count: 'exact' },
          )
          .eq('owner_id', user.id);

        // Apply filters
        if (searchParams.query) {
          query = query.or(`invoice_number.ilike.%${searchParams.query}%,clients.name.ilike.%${searchParams.query}%`);
        }

        if (searchParams.client_id) {
          query = query.eq('client_id', searchParams.client_id);
        }

        if (searchParams.status) {
          query = query.eq('status', searchParams.status);
        }

        if (searchParams.ksef_status) {
          query = query.eq('ksef_status', searchParams.ksef_status);
        }

        if (searchParams.date_from) {
          query = query.gte('issue_date', searchParams.date_from);
        }

        if (searchParams.date_to) {
          query = query.lte('issue_date', searchParams.date_to);
        }

        if (searchParams.amount_from) {
          query = query.gte('total_gross', searchParams.amount_from);
        }

        if (searchParams.amount_to) {
          query = query.lte('total_gross', searchParams.amount_to);
        }

        // Pagination
        const from = (searchParams.page - 1) * searchParams.limit;
        const to = from + searchParams.limit - 1;

        query = query.order('created_at', { ascending: false }).range(from, to);

        const { data, error: queryError, count } = await query;

        if (queryError) throw queryError;

        setInvoices(data || []);
        setTotalCount(count || 0);
        setCurrentPage(searchParams.page);

        logger.info('Invoices loaded successfully', {
          count: data?.length,
          total: count,
          page: searchParams.page,
        });
      } catch (error) {
        logger.error('Error loading invoices:', error);
        setError(error instanceof Error ? error.message : 'Wystąpił błąd podczas ładowania faktur');
      } finally {
        setIsLoading(false);
      }
    },
    [user, supabase],
  );

  // Load invoices on mount and when search params change
  useEffect(() => {
    loadInvoices(watchedValues);
  }, [loadInvoices, watchedValues]);

  const onSearch = (data: InvoiceSearch) => {
    loadInvoices({ ...data, page: 1 });
  };

  const handlePageChange = (page: number) => {
    loadInvoices({ ...watchedValues, page });
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tę fakturę?')) return;

    try {
      const { error } = await supabase.from('invoices').delete().eq('id', invoiceId).eq('owner_id', user?.id);

      if (error) throw error;

      // Reload invoices
      loadInvoices(watchedValues);
      logger.info('Invoice deleted successfully', { invoiceId });
    } catch (error) {
      logger.error('Error deleting invoice:', error);
      alert('Wystąpił błąd podczas usuwania faktury');
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  if (!user) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='rounded-lg bg-yellow-50 p-4'>
          <p className='text-yellow-800'>Musisz się zalogować, aby zobaczyć faktury.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      {/* Header */}
      <div className='mb-6 flex items-center justify-between'>
        <h1 className='text-3xl font-bold text-gray-900'>Faktury</h1>
        <Link
          href='/invoices/new'
          className='inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none'>
          <BsPlus className='mr-2 h-4 w-4' />
          Nowa faktura
        </Link>
      </div>

      {/* Search and Filters */}
      <div className='mb-6 rounded-lg bg-white shadow'>
        <form onSubmit={handleSubmit(onSearch)} className='p-4'>
          <div className='flex items-center space-x-4'>
            <div className='flex-1'>
              <div className='relative'>
                <BsSearch className='absolute top-3 left-3 h-4 w-4 text-gray-400' />
                <input
                  {...register('query')}
                  type='text'
                  placeholder='Szukaj po numerze faktury lub nazwie klienta...'
                  className='block w-full rounded-md border border-gray-300 py-2 pr-3 pl-10 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm'
                />
              </div>
            </div>
            <button
              type='button'
              onClick={() => setShowFilters(!showFilters)}
              className='inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none'>
              Filtry
            </button>
            <button
              type='submit'
              className='inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none'>
              Szukaj
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className='mt-4 grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 sm:grid-cols-2 lg:grid-cols-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700'>Status</label>
                <select
                  {...register('status')}
                  className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm'>
                  <option value=''>Wszystkie</option>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700'>Status KSeF</label>
                <select
                  {...register('ksef_status')}
                  className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm'>
                  <option value=''>Wszystkie</option>
                  {Object.entries(KSEF_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700'>Data od</label>
                <input
                  {...register('date_from')}
                  type='date'
                  className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700'>Data do</label>
                <input
                  {...register('date_to')}
                  type='date'
                  className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm'
                />
              </div>

              <div className='sm:col-span-2 lg:col-span-4'>
                <button
                  type='button'
                  onClick={() => {
                    reset({ page: 1, limit: ITEMS_PER_PAGE });
                    setShowFilters(false);
                  }}
                  className='text-sm text-indigo-600 hover:text-indigo-800'>
                  Wyczyść filtry
                </button>
              </div>
            </div>
          )}
        </form>
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

      {/* Loading State */}
      {isLoading && (
        <div className='rounded-lg bg-white p-6 shadow'>
          <div className='flex items-center justify-center'>
            <div className='h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent'></div>
            <span className='ml-2 text-gray-600'>Ładowanie faktur...</span>
          </div>
        </div>
      )}

      {/* Invoices List */}
      {!isLoading && (
        <>
          {invoices.length === 0 ? (
            <div className='rounded-lg bg-white p-6 shadow'>
              <div className='text-center'>
                <BsFileText className='mx-auto h-12 w-12 text-gray-400' />
                <h3 className='mt-2 text-sm font-medium text-gray-900'>Brak faktur</h3>
                <p className='mt-1 text-sm text-gray-500'>
                  {watchedValues.query || showFilters
                    ? 'Nie znaleziono faktur spełniających kryteria wyszukiwania.'
                    : 'Zacznij od utworzenia pierwszej faktury.'}
                </p>
                {!watchedValues.query && !showFilters && (
                  <div className='mt-6'>
                    <Link
                      href='/invoices/new'
                      className='inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none'>
                      <BsPlus className='mr-2 h-4 w-4' />
                      Utwórz pierwszą fakturę
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Results Summary */}
              <div className='mb-4 text-sm text-gray-600'>
                Pokazano {invoices.length} z {totalCount} faktur
                {totalPages > 1 && ` (strona ${currentPage} z ${totalPages})`}
              </div>

              {/* Invoices Table */}
              <div className='overflow-hidden rounded-lg bg-white shadow'>
                <div className='overflow-x-auto'>
                  <table className='min-w-full divide-y divide-gray-200'>
                    <thead className='bg-gray-50'>
                      <tr>
                        <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                          Numer / Klient
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                          Daty
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                          Kwota
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                          Status
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                          KSeF
                        </th>
                        <th className='relative px-6 py-3'>
                          <span className='sr-only'>Akcje</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-200 bg-white'>
                      {invoices.map((invoice) => (
                        <tr key={invoice.id} className='hover:bg-gray-50'>
                          <td className='px-6 py-4 whitespace-nowrap'>
                            <div>
                              <div className='text-sm font-medium text-gray-900'>{invoice.number}</div>
                              <div className='text-sm text-gray-500'>
                                {invoice.clients?.name || 'Klient usunięty'}
                                {invoice.clients?.vat_id && (
                                  <span className='ml-1 text-xs text-gray-400'>({invoice.clients.vat_id})</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-900'>
                            <div>
                              <div className='flex items-center'>
                                <BsCalendar className='mr-1 h-3 w-3 text-gray-400' />
                                {new Date(invoice.issue_date).toLocaleDateString('pl-PL')}
                              </div>
                              {invoice.due_date && (
                                <div className='flex items-center text-gray-500'>
                                  <BsClock className='mr-1 h-3 w-3' />
                                  {new Date(invoice.due_date).toLocaleDateString('pl-PL')}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className='px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900'>
                            {invoice.total_gross.toFixed(2)} {invoice.currency}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap'>
                            <span
                              className={cn(
                                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                                STATUS_COLORS[invoice.status as keyof typeof STATUS_COLORS],
                              )}>
                              {STATUS_LABELS[invoice.status as keyof typeof STATUS_LABELS]}
                            </span>
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap'>
                            <span
                              className={cn(
                                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                                KSEF_STATUS_COLORS[invoice.ksef_status as keyof typeof KSEF_STATUS_COLORS],
                              )}>
                              {KSEF_STATUS_LABELS[invoice.ksef_status as keyof typeof KSEF_STATUS_LABELS]}
                            </span>
                          </td>
                          <td className='px-6 py-4 text-right text-sm font-medium whitespace-nowrap'>
                            <div className='flex items-center justify-end space-x-2'>
                              <Link
                                href={`/invoices/${invoice.id}`}
                                className='text-indigo-600 hover:text-indigo-900'
                                title='Zobacz szczegóły'>
                                <BsEye className='h-4 w-4' />
                              </Link>
                              <Link
                                href={`/invoices/${invoice.id}/edit`}
                                className='text-indigo-600 hover:text-indigo-900'
                                title='Edytuj'>
                                <BsPencil className='h-4 w-4' />
                              </Link>
                              <button
                                onClick={() => handleDeleteInvoice(invoice.id)}
                                className='text-red-600 hover:text-red-900'
                                title='Usuń'>
                                <BsTrash className='h-4 w-4' />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className='mt-6 flex items-center justify-between'>
                  <div className='flex items-center'>
                    <p className='text-sm text-gray-700'>
                      Strona <span className='font-medium'>{currentPage}</span> z{' '}
                      <span className='font-medium'>{totalPages}</span>
                    </p>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className='rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'>
                      Poprzednia
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = Math.max(1, currentPage - 2) + i;
                      if (page > totalPages) return null;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={cn(
                            'rounded-md px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none',
                            page === currentPage
                              ? 'bg-indigo-600 text-white'
                              : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
                          )}>
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className='rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'>
                      Następna
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
