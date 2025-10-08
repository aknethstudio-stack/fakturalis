'use client';

import { useAuth, useSupabase } from '@/hooks/use-supabase';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import {
  calculateInvoiceItemAmounts,
  calculateInvoiceTotals,
  invoiceSchema,
  PAYMENT_METHODS,
  VAT_RATES,
  type Invoice,
} from '@/lib/validations/invoice';
import type { Database } from '@/types/database';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { BsCheck, BsPerson, BsPlus, BsTrash, BsX } from 'react-icons/bs';

type Client = Database['public']['Tables']['clients']['Row'];
type Product = Database['public']['Tables']['products']['Row'];
type InvoiceRow = Database['public']['Tables']['invoices']['Row'];

interface InvoiceFormProps {
  invoice?: InvoiceRow;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function InvoiceForm({ invoice, onSuccess, onCancel }: InvoiceFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [_selectedClient, setSelectedClient] = useState<Client | null>(null);
  const { user } = useAuth();
  const supabase = useSupabase();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
    reset: _reset,
  } = useForm<Invoice>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      client_id: '',
      invoice_number: '',
      issue_date: new Date().toISOString().split('T')[0]!,
      sale_date: new Date().toISOString().split('T')[0]!,
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!, // 14 days from now
      payment_method: 'TRANSFER' as const,
      currency: 'PLN',
      exchange_rate: 1.0,
      status: 'DRAFT' as const,
      ksef_status: 'NOT_SENT' as const,
      items: [
        {
          name: '',
          quantity: 1,
          unit: 'szt.',
          unit_price_net: 0,
          vat_rate: 23,
          net_amount: 0,
          vat_amount: 0,
          gross_amount: 0,
        },
      ],
      total_net: 0,
      total_vat: 0,
      total_gross: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');

  // Load clients and products
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        // Load clients
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('*')
          .eq('owner_id', user.id)
          .order('name');

        if (clientsError) throw clientsError;
        setClients(clientsData || []);

        // Load products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('owner_id', user.id)
          .eq('active', true)
          .order('name');

        if (productsError) throw productsError;
        setProducts(productsData || []);
      } catch (error) {
        logger.error('Error loading form data:', error);
      }
    };

    loadData();
  }, [user, supabase]);

  // Generate invoice number
  useEffect(() => {
    if (!user || invoice) return;

    const generateInvoiceNumber = async () => {
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select('invoice_number')
          .eq('owner_id', user.id)
          .like('invoice_number', `${new Date().getFullYear()}/%`)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) throw error;

        const year = new Date().getFullYear();
        const lastNumber = data?.[0]?.invoice_number.split('/')[1];
        const nextNumber = lastNumber ? parseInt(lastNumber) + 1 : 1;
        const invoiceNumber = `${year}/${nextNumber.toString().padStart(3, '0')}`;

        setValue('invoice_number', invoiceNumber);
      } catch (error) {
        logger.error('Error generating invoice number:', error);
      }
    };

    generateInvoiceNumber();
  }, [user, supabase, invoice, setValue]);

  // Handle client selection
  const handleClientChange = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    setSelectedClient(client || null);
  };

  // Handle product selection for item
  const handleProductSelect = (itemIndex: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setValue(`items.${itemIndex}.product_id`, product.id);
      setValue(`items.${itemIndex}.name`, product.name);
      setValue(`items.${itemIndex}.description`, product.notes || '');
      setValue(`items.${itemIndex}.unit`, product.unit);
      setValue(`items.${itemIndex}.unit_price_net`, product.unit_price);
      setValue(`items.${itemIndex}.vat_rate`, product.vat_rate_default);

      // Recalculate amounts
      const quantity = watch(`items.${itemIndex}.quantity`) || 1;
      const amounts = calculateInvoiceItemAmounts(quantity, product.unit_price, product.vat_rate_default);
      setValue(`items.${itemIndex}.net_amount`, amounts.netAmount);
      setValue(`items.${itemIndex}.vat_amount`, amounts.vatAmount);
      setValue(`items.${itemIndex}.gross_amount`, amounts.grossAmount);
    }
  };

  // Recalculate item amounts when quantity, price, or VAT changes
  const recalculateItem = useCallback(
    (itemIndex: number) => {
      const item = watchedItems[itemIndex];
      if (item) {
        const amounts = calculateInvoiceItemAmounts(item.quantity || 0, item.unit_price_net || 0, item.vat_rate || 0);
        setValue(`items.${itemIndex}.net_amount`, amounts.netAmount);
        setValue(`items.${itemIndex}.vat_amount`, amounts.vatAmount);
        setValue(`items.${itemIndex}.gross_amount`, amounts.grossAmount);
      }
    },
    [watchedItems, setValue],
  );

  // Recalculate totals when items change
  useEffect(() => {
    const totals = calculateInvoiceTotals(watchedItems.filter(Boolean));
    setValue('total_net', totals.totalNet);
    setValue('total_vat', totals.totalVat);
    setValue('total_gross', totals.totalGross);
  }, [watchedItems, setValue]);

  const onSubmit = async (data: Invoice) => {
    if (!user) {
      setSubmitError('Nie jesteś zalogowany');
      return;
    }

    setIsLoading(true);
    setSubmitError('');

    try {
      if (invoice) {
        // Update existing invoice
        const { error: updateError } = await supabase
          .from('invoices')
          .update({
            client_id: data.client_id,
            invoice_number: data.invoice_number,
            issue_date: data.issue_date,
            sale_date: data.sale_date,
            due_date: data.due_date,
            payment_method: data.payment_method,
            payment_terms: data.payment_terms,
            currency: data.currency,
            exchange_rate: data.exchange_rate,
            notes: data.notes,
            status: data.status,
            total_net: data.total_net,
            total_vat: data.total_vat,
            total_gross: data.total_gross,
          })
          .eq('id', invoice.id)
          .eq('owner_id', user.id);

        if (updateError) throw updateError;

        // Delete existing items and insert new ones
        const { error: deleteError } = await supabase.from('invoice_items').delete().eq('invoice_id', invoice.id);

        if (deleteError) throw deleteError;

        const itemsToInsert = data.items.map((item) => ({
          invoice_id: invoice.id,
          product_id: item.product_id || null,
          name: item.name,
          description: item.description || null,
          quantity: item.quantity,
          unit: item.unit,
          unit_price_net: item.unit_price_net,
          vat_rate: item.vat_rate,
          net_amount: item.net_amount,
          vat_amount: item.vat_amount,
          gross_amount: item.gross_amount,
        }));

        const { error: itemsError } = await supabase.from('invoice_items').insert(itemsToInsert);

        if (itemsError) throw itemsError;

        logger.info('Invoice updated successfully', { invoiceId: invoice.id });
      } else {
        // Create new invoice
        const { data: newInvoice, error: invoiceError } = await supabase
          .from('invoices')
          .insert({
            owner_id: user.id,
            client_id: data.client_id,
            invoice_number: data.invoice_number,
            issue_date: data.issue_date,
            sale_date: data.sale_date,
            due_date: data.due_date,
            payment_method: data.payment_method,
            payment_terms: data.payment_terms,
            currency: data.currency,
            exchange_rate: data.exchange_rate,
            notes: data.notes,
            status: data.status,
            ksef_status: data.ksef_status,
            total_net: data.total_net,
            total_vat: data.total_vat,
            total_gross: data.total_gross,
          })
          .select()
          .single();

        if (invoiceError) throw invoiceError;

        const itemsToInsert = data.items.map((item) => ({
          invoice_id: newInvoice.id,
          product_id: item.product_id || null,
          name: item.name,
          description: item.description || null,
          quantity: item.quantity,
          unit: item.unit,
          unit_price_net: item.unit_price_net,
          vat_rate: item.vat_rate,
          net_amount: item.net_amount,
          vat_amount: item.vat_amount,
          gross_amount: item.gross_amount,
        }));

        const { error: itemsError } = await supabase.from('invoice_items').insert(itemsToInsert);

        if (itemsError) throw itemsError;

        logger.info('Invoice created successfully', { invoiceId: newInvoice.id });
      }

      onSuccess?.();
    } catch (error) {
      logger.error('Error saving invoice:', error);
      setSubmitError(error instanceof Error ? error.message : 'Wystąpił błąd podczas zapisywania faktury');
    } finally {
      setIsLoading(false);
    }
  };

  if (!clients.length) {
    return (
      <div className='rounded-lg bg-yellow-50 p-4'>
        <div className='flex'>
          <div className='flex-shrink-0'>
            <BsPerson className='h-5 w-5 text-yellow-400' />
          </div>
          <div className='ml-3'>
            <h3 className='text-sm font-medium text-yellow-800'>Brak klientów</h3>
            <div className='mt-2 text-sm text-yellow-700'>
              <p>
                Aby utworzyć fakturę, musisz najpierw dodać klienta.{' '}
                <button
                  onClick={() => router.push('/clients/new')}
                  className='font-medium underline hover:text-yellow-600'>
                  Dodaj klienta
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
      {submitError && (
        <div className='rounded-md bg-red-50 p-4'>
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

      {/* Basic Information */}
      <div className='rounded-lg bg-white shadow'>
        <div className='px-4 py-5 sm:p-6'>
          <h3 className='mb-4 text-lg font-medium text-gray-900'>Podstawowe informacje</h3>

          <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
            {/* Client Selection */}
            <div className='sm:col-span-2'>
              <label htmlFor='client_id' className='block text-sm font-medium text-gray-700'>
                Klient <span className='text-red-500'>*</span>
              </label>
              <select
                {...register('client_id')}
                onChange={(e) => {
                  register('client_id').onChange(e);
                  handleClientChange(e.target.value);
                }}
                className={cn(
                  'mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm',
                  errors.client_id
                    ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                )}
                aria-label='Wybierz klienta'>
                <option value=''>Wybierz klienta</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} {client.vat_id && `(${client.vat_id})`}
                  </option>
                ))}
              </select>
              {errors.client_id && <p className='mt-1 text-sm text-red-600'>{errors.client_id.message}</p>}
            </div>

            {/* Invoice Number */}
            <div>
              <label htmlFor='invoice_number' className='block text-sm font-medium text-gray-700'>
                Numer faktury <span className='text-red-500'>*</span>
              </label>
              <input
                {...register('invoice_number')}
                type='text'
                className={cn(
                  'mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm',
                  errors.invoice_number
                    ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                )}
                placeholder='2024/001'
              />
              {errors.invoice_number && <p className='mt-1 text-sm text-red-600'>{errors.invoice_number.message}</p>}
            </div>

            {/* Issue Date */}
            <div>
              <label htmlFor='issue_date' className='block text-sm font-medium text-gray-700'>
                Data wystawienia <span className='text-red-500'>*</span>
              </label>
              <input
                {...register('issue_date')}
                type='date'
                className={cn(
                  'mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm',
                  errors.issue_date
                    ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                )}
              />
              {errors.issue_date && <p className='mt-1 text-sm text-red-600'>{errors.issue_date.message}</p>}
            </div>

            {/* Sale Date */}
            <div>
              <label htmlFor='sale_date' className='block text-sm font-medium text-gray-700'>
                Data sprzedaży
              </label>
              <input
                {...register('sale_date')}
                type='date'
                className={cn(
                  'mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm',
                  errors.sale_date
                    ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                )}
              />
              {errors.sale_date && <p className='mt-1 text-sm text-red-600'>{errors.sale_date.message}</p>}
            </div>

            {/* Due Date */}
            <div>
              <label htmlFor='due_date' className='block text-sm font-medium text-gray-700'>
                Termin płatności <span className='text-red-500'>*</span>
              </label>
              <input
                {...register('due_date')}
                type='date'
                className={cn(
                  'mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm',
                  errors.due_date
                    ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                )}
              />
              {errors.due_date && <p className='mt-1 text-sm text-red-600'>{errors.due_date.message}</p>}
            </div>

            {/* Payment Method */}
            <div>
              <label htmlFor='payment_method' className='block text-sm font-medium text-gray-700'>
                Forma płatności <span className='text-red-500'>*</span>
              </label>
              <select
                {...register('payment_method')}
                className={cn(
                  'mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm',
                  errors.payment_method
                    ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                )}>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method === 'TRANSFER' && 'Przelew'}
                    {method === 'CASH' && 'Gotówka'}
                    {method === 'CARD' && 'Karta'}
                    {method === 'BLIK' && 'BLIK'}
                    {method === 'PAYPAL' && 'PayPal'}
                    {method === 'CHECK' && 'Czek'}
                    {method === 'OTHER' && 'Inne'}
                  </option>
                ))}
              </select>
              {errors.payment_method && <p className='mt-1 text-sm text-red-600'>{errors.payment_method.message}</p>}
            </div>

            {/* Payment Terms */}
            <div className='sm:col-span-2'>
              <label htmlFor='payment_terms' className='block text-sm font-medium text-gray-700'>
                Warunki płatności
              </label>
              <input
                {...register('payment_terms')}
                type='text'
                className={cn(
                  'mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm',
                  errors.payment_terms
                    ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                )}
                placeholder='np. Płatność w terminie 14 dni'
              />
              {errors.payment_terms && <p className='mt-1 text-sm text-red-600'>{errors.payment_terms.message}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Items */}
      <div className='rounded-lg bg-white shadow'>
        <div className='px-4 py-5 sm:p-6'>
          <div className='mb-4 flex items-center justify-between'>
            <h3 className='text-lg font-medium text-gray-900'>Pozycje faktury</h3>
            <button
              type='button'
              onClick={() =>
                append({
                  name: '',
                  quantity: 1,
                  unit: 'szt.',
                  unit_price_net: 0,
                  vat_rate: 23,
                  net_amount: 0,
                  vat_amount: 0,
                  gross_amount: 0,
                })
              }
              className='inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none'>
              <BsPlus className='mr-1 h-4 w-4' />
              Dodaj pozycję
            </button>
          </div>

          <div className='space-y-4'>
            {fields.map((field, index) => (
              <div key={field.id} className='rounded-lg border border-gray-200 p-4'>
                <div className='mb-4 flex items-center justify-between'>
                  <h4 className='text-sm font-medium text-gray-700'>Pozycja {index + 1}</h4>
                  {fields.length > 1 && (
                    <button
                      type='button'
                      onClick={() => remove(index)}
                      className='text-red-600 hover:text-red-800'
                      title='Usuń pozycję'
                      aria-label='Usuń pozycję'>
                      <BsTrash className='h-4 w-4' />
                    </button>
                  )}
                </div>

                <div className='grid grid-cols-1 gap-4 sm:grid-cols-6'>
                  {/* Product Selection */}
                  <div className='sm:col-span-6'>
                    <label className='block text-sm font-medium text-gray-700'>Wybierz produkt (opcjonalnie)</label>
                    <select
                      onChange={(e) => handleProductSelect(index, e.target.value)}
                      className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm'>
                      <option value=''>-- Wybierz produkt lub wpisz ręcznie --</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} - {product.unit_price.toFixed(2)} PLN netto
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Name */}
                  <div className='sm:col-span-3'>
                    <label className='block text-sm font-medium text-gray-700'>
                      Nazwa <span className='text-red-500'>*</span>
                    </label>
                    <input
                      {...register(`items.${index}.name`)}
                      type='text'
                      className={cn(
                        'mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm',
                        errors.items?.[index]?.name
                          ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                      )}
                    />
                    {errors.items?.[index]?.name && (
                      <p className='mt-1 text-sm text-red-600'>{errors.items[index]?.name?.message}</p>
                    )}
                  </div>

                  {/* Description */}
                  <div className='sm:col-span-3'>
                    <label className='block text-sm font-medium text-gray-700'>Opis</label>
                    <input
                      {...register(`items.${index}.description`)}
                      type='text'
                      className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm'
                    />
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>
                      Ilość <span className='text-red-500'>*</span>
                    </label>
                    <input
                      {...register(`items.${index}.quantity`, {
                        valueAsNumber: true,
                        onChange: () => recalculateItem(index),
                      })}
                      type='number'
                      step='0.01'
                      min='0.01'
                      className={cn(
                        'mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm',
                        errors.items?.[index]?.quantity
                          ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                      )}
                    />
                    {errors.items?.[index]?.quantity && (
                      <p className='mt-1 text-sm text-red-600'>{errors.items[index]?.quantity?.message}</p>
                    )}
                  </div>

                  {/* Unit */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>
                      Jednostka <span className='text-red-500'>*</span>
                    </label>
                    <input
                      {...register(`items.${index}.unit`)}
                      type='text'
                      className={cn(
                        'mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm',
                        errors.items?.[index]?.unit
                          ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                      )}
                      placeholder='szt.'
                    />
                    {errors.items?.[index]?.unit && (
                      <p className='mt-1 text-sm text-red-600'>{errors.items[index]?.unit?.message}</p>
                    )}
                  </div>

                  {/* Unit Price Net */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>
                      Cena netto <span className='text-red-500'>*</span>
                    </label>
                    <input
                      {...register(`items.${index}.unit_price_net`, {
                        valueAsNumber: true,
                        onChange: () => recalculateItem(index),
                      })}
                      type='number'
                      step='0.01'
                      min='0'
                      className={cn(
                        'mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm',
                        errors.items?.[index]?.unit_price_net
                          ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                      )}
                    />
                    {errors.items?.[index]?.unit_price_net && (
                      <p className='mt-1 text-sm text-red-600'>{errors.items[index]?.unit_price_net?.message}</p>
                    )}
                  </div>

                  {/* VAT Rate */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>
                      VAT % <span className='text-red-500'>*</span>
                    </label>
                    <select
                      {...register(`items.${index}.vat_rate`, {
                        valueAsNumber: true,
                        onChange: () => recalculateItem(index),
                      })}
                      className={cn(
                        'mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm',
                        errors.items?.[index]?.vat_rate
                          ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                      )}>
                      {VAT_RATES.map((rate) => (
                        <option key={rate} value={rate}>
                          {rate}%
                        </option>
                      ))}
                    </select>
                    {errors.items?.[index]?.vat_rate && (
                      <p className='mt-1 text-sm text-red-600'>{errors.items[index]?.vat_rate?.message}</p>
                    )}
                  </div>

                  {/* Net Amount */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>Netto</label>
                    <input
                      {...register(`items.${index}.net_amount`, { valueAsNumber: true })}
                      type='number'
                      step='0.01'
                      readOnly
                      className='mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm sm:text-sm'
                    />
                  </div>

                  {/* VAT Amount */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>VAT</label>
                    <input
                      {...register(`items.${index}.vat_amount`, { valueAsNumber: true })}
                      type='number'
                      step='0.01'
                      readOnly
                      className='mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm sm:text-sm'
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {errors.items && <p className='mt-2 text-sm text-red-600'>{errors.items.message}</p>}
        </div>
      </div>

      {/* Totals */}
      <div className='rounded-lg bg-white shadow'>
        <div className='px-4 py-5 sm:p-6'>
          <h3 className='mb-4 text-lg font-medium text-gray-900'>Podsumowanie</h3>

          <div className='space-y-4'>
            <div className='flex justify-between text-sm'>
              <span className='text-gray-500'>Suma netto:</span>
              <span className='font-medium'>{watch('total_net')?.toFixed(2) || '0.00'} PLN</span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-gray-500'>Suma VAT:</span>
              <span className='font-medium'>{watch('total_vat')?.toFixed(2) || '0.00'} PLN</span>
            </div>
            <div className='border-t border-gray-200 pt-4'>
              <div className='flex justify-between'>
                <span className='text-base font-medium text-gray-900'>Suma brutto:</span>
                <span className='text-lg font-bold text-gray-900'>
                  {watch('total_gross')?.toFixed(2) || '0.00'} PLN
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className='rounded-lg bg-white shadow'>
        <div className='px-4 py-5 sm:p-6'>
          <label htmlFor='notes' className='block text-sm font-medium text-gray-700'>
            Uwagi
          </label>
          <textarea
            {...register('notes')}
            rows={3}
            className={cn(
              'mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm',
              errors.notes
                ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
            )}
            placeholder='Dodatkowe informacje do faktury...'
          />
          {errors.notes && <p className='mt-1 text-sm text-red-600'>{errors.notes.message}</p>}
        </div>
      </div>

      {/* Actions */}
      <div className='flex justify-end space-x-3 border-t border-gray-200 pt-6'>
        <button
          type='button'
          onClick={onCancel || (() => router.push('/invoices'))}
          className='rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none'>
          Anuluj
        </button>
        <button
          type='submit'
          disabled={isLoading}
          className='flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'>
          {isLoading ? (
            <div
              data-testid='loading-spinner'
              className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent'
            />
          ) : (
            <BsCheck className='mr-2 h-4 w-4' />
          )}
          {invoice ? 'Zaktualizuj fakturę' : 'Utwórz fakturę'}
        </button>
      </div>
    </form>
  );
}
