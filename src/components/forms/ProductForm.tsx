'use client';

import { useAuth, useSupabase } from '@/hooks/use-supabase';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { POLISH_UNITS, POLISH_VAT_RATES, type ProductFormData } from '@/lib/validations/product';
import type { Database } from '@/types/database';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { BsBoxSeam, BsCheck, BsCurrencyDollar, BsHash, BsInfoCircle, BsPercent, BsRulers, BsX } from 'react-icons/bs';

type Product = Database['public']['Tables']['products']['Row'];

interface ProductFormProps {
  product?: Product | null;
  onSuccess?: (product: Product) => void;
  onCancel?: () => void;
}

export default function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const { user } = useAuth();
  const supabase = useSupabase();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
    watch,
  } = useForm<ProductFormData>({
    defaultValues: product
      ? {
          name: product.name,
          sku: product.sku || undefined,
          unit: product.unit,
          unit_price: product.unit_price,
          vat_rate_default: product.vat_rate_default,
          currency: product.currency,
          active: product.active,
          notes: product.notes || undefined,
        }
      : {
          unit: 'szt',
          unit_price: 0,
          vat_rate_default: 0.23,
          currency: 'PLN',
          active: true,
        },
  });

  const watchedVATRate = watch('vat_rate_default');
  const watchedPrice = watch('unit_price');
  const watchedCurrency = watch('currency');

  const onSubmit = async (data: ProductFormData) => {
    if (!user) {
      setSubmitError('Musisz być zalogowany');
      return;
    }

    try {
      setIsLoading(true);
      setSubmitError('');

      // Validate required fields
      if (!data.name?.trim()) {
        setError('name', {
          type: 'manual',
          message: 'Nazwa produktu jest wymagana',
        });
        return;
      }

      // Validate unit price
      if (data.unit_price < 0) {
        setError('unit_price', {
          type: 'manual',
          message: 'Cena jednostkowa nie może być ujemna',
        });
        return;
      }

      // Validate VAT rate
      if (data.vat_rate_default < 0 || data.vat_rate_default > 1) {
        setError('vat_rate_default', {
          type: 'manual',
          message: 'Stawka VAT musi być między 0% a 100%',
        });
        return;
      }

      // Check if SKU is unique (if provided)
      if (data.sku?.trim()) {
        const { data: existingProduct } = await supabase
          .from('products')
          .select('id')
          .eq('owner_id', user.id)
          .eq('sku', data.sku.trim())
          .neq('id', product?.id || '')
          .single();

        if (existingProduct) {
          setError('sku', {
            type: 'manual',
            message: 'SKU musi być unikalne - produkt z tym kodem już istnieje',
          });
          return;
        }
      }

      const productData = {
        name: data.name.trim(),
        sku: data.sku?.trim() || null,
        unit: data.unit,
        unit_price: data.unit_price,
        vat_rate_default: data.vat_rate_default,
        currency: data.currency,
        active: data.active,
        notes: data.notes?.trim() || null,
        owner_id: user.id,
      };

      let result;

      if (product) {
        // Update existing product
        result = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id)
          .eq('owner_id', user.id)
          .select()
          .single();
      } else {
        // Create new product
        result = await supabase.from('products').insert(productData).select().single();
      }

      if (result.error) {
        logger.error('Database error', result.error, {
          component: 'ProductForm',
          operation: product ? 'update' : 'create',
        });
        setSubmitError('Wystąpił błąd podczas zapisywania produktu');
        return;
      }

      logger.info(product ? 'Product updated successfully' : 'Product created successfully', {
        productId: result.data.id,
        component: 'ProductForm',
      });

      if (onSuccess) {
        onSuccess(result.data);
      } else if (typeof window !== 'undefined') {
        router.push('/products');
      }

      if (!product) {
        reset();
      }
    } catch (error) {
      logger.error('Failed to save product', error, { component: 'ProductForm' });
      setSubmitError('Wystąpił nieoczekiwany błąd');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPreviewPrice = () => {
    if (!watchedPrice || watchedPrice === 0) return '0,00 PLN';

    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: watchedCurrency || 'PLN',
    }).format(watchedPrice);
  };

  const formatVATDisplay = () => {
    const rate = watchedVATRate || 0;
    return `${Math.round(rate * 100)}%`;
  };

  return (
    <div className='mx-auto max-w-2xl'>
      <div className='rounded-lg bg-white shadow-sm ring-1 ring-gray-200'>
        <div className='border-b border-gray-200 px-6 py-4'>
          <h2 className='flex items-center text-lg font-semibold text-gray-900'>
            <BsBoxSeam className='mr-2' />
            {product ? 'Edytuj produkt' : 'Dodaj nowy produkt'}
          </h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6 p-6'>
          {submitError && (
            <div className='rounded-md border border-red-200 bg-red-50 p-4' role='alert'>
              <div className='flex'>
                <BsX className='h-5 w-5 text-red-400' />
                <div className='ml-3'>
                  <p className='text-sm text-red-800'>{submitError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className='space-y-4'>
            <h3 className='text-md flex items-center font-medium text-gray-900'>
              <BsInfoCircle className='mr-2' />
              Podstawowe informacje
            </h3>

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <div className='sm:col-span-2'>
                <label htmlFor='name' className='block text-sm font-medium text-gray-700'>
                  Nazwa produktu *
                </label>
                <input
                  {...register('name')}
                  type='text'
                  id='name'
                  className={cn(
                    'mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm',
                    errors.name
                      ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                  )}
                  placeholder='np. Konsultacja IT'
                />
                {errors.name && <p className='mt-1 text-sm text-red-600'>{errors.name.message}</p>}
              </div>

              <div>
                <label htmlFor='sku' className='block text-sm font-medium text-gray-700'>
                  <BsHash className='mr-1 inline' />
                  SKU/Kod produktu
                </label>
                <input
                  {...register('sku')}
                  type='text'
                  id='sku'
                  className={cn(
                    'mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm',
                    errors.sku
                      ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                  )}
                  placeholder='np. CONS-IT-001'
                />
                {errors.sku && <p className='mt-1 text-sm text-red-600'>{errors.sku.message}</p>}
              </div>

              <div>
                <label htmlFor='unit' className='block text-sm font-medium text-gray-700'>
                  <BsRulers className='mr-1 inline' />
                  Jednostka miary *
                </label>
                <select
                  {...register('unit')}
                  id='unit'
                  className={cn(
                    'mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm',
                    errors.unit
                      ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                  )}>
                  {POLISH_UNITS.map((unit) => (
                    <option key={unit.code} value={unit.code}>
                      {unit.name} ({unit.code})
                    </option>
                  ))}
                </select>
                {errors.unit && <p className='mt-1 text-sm text-red-600'>{errors.unit.message}</p>}
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className='space-y-4'>
            <h3 className='text-md flex items-center font-medium text-gray-900'>
              <BsCurrencyDollar className='mr-2' />
              Cena i VAT
            </h3>

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
              <div>
                <label htmlFor='unit_price' className='block text-sm font-medium text-gray-700'>
                  Cena jednostkowa *
                </label>
                <div className='relative mt-1 rounded-md shadow-sm'>
                  <input
                    {...register('unit_price', { valueAsNumber: true })}
                    type='number'
                    id='unit_price'
                    step='0.01'
                    min='0'
                    className={cn(
                      'block w-full rounded-md border px-3 py-2 pr-12 shadow-sm focus:outline-none sm:text-sm',
                      errors.unit_price
                        ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                    )}
                    placeholder='0.00'
                  />
                  <div className='absolute inset-y-0 right-0 flex items-center pr-3'>
                    <span className='text-gray-500 sm:text-sm'>{watchedCurrency}</span>
                  </div>
                </div>
                {errors.unit_price && <p className='mt-1 text-sm text-red-600'>{errors.unit_price.message}</p>}
              </div>

              <div>
                <label htmlFor='vat_rate_default' className='block text-sm font-medium text-gray-700'>
                  <BsPercent className='mr-1 inline' />
                  Stawka VAT *
                </label>
                <select
                  {...register('vat_rate_default', { valueAsNumber: true })}
                  id='vat_rate_default'
                  className={cn(
                    'mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm',
                    errors.vat_rate_default
                      ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                  )}>
                  {POLISH_VAT_RATES.map((rate) => (
                    <option key={rate.value} value={rate.value}>
                      {rate.label} - {rate.description}
                    </option>
                  ))}
                </select>
                {errors.vat_rate_default && (
                  <p className='mt-1 text-sm text-red-600'>{errors.vat_rate_default.message}</p>
                )}
              </div>

              <div>
                <label htmlFor='currency' className='block text-sm font-medium text-gray-700'>
                  Waluta *
                </label>
                <select
                  {...register('currency')}
                  id='currency'
                  className={cn(
                    'mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm',
                    errors.currency
                      ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                  )}>
                  <option value='PLN'>PLN - Polski złoty</option>
                  <option value='EUR'>EUR - Euro</option>
                  <option value='USD'>USD - Dolar amerykański</option>
                  <option value='GBP'>GBP - Funt brytyjski</option>
                </select>
                {errors.currency && <p className='mt-1 text-sm text-red-600'>{errors.currency.message}</p>}
              </div>
            </div>

            {/* Price Preview */}
            <div className='rounded-md bg-gray-50 p-4'>
              <p className='text-sm text-gray-600'>Podgląd ceny:</p>
              <p className='text-lg font-semibold text-gray-900'>
                {formatPreviewPrice()} (VAT: {formatVATDisplay()})
              </p>
            </div>
          </div>

          {/* Status and Notes */}
          <div className='space-y-4'>
            <div className='flex items-center'>
              <input
                {...register('active')}
                id='active'
                type='checkbox'
                className='h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
              />
              <label htmlFor='active' className='ml-2 block text-sm text-gray-900'>
                Produkt aktywny
              </label>
            </div>

            <div>
              <label htmlFor='notes' className='block text-sm font-medium text-gray-700'>
                Notatki
              </label>
              <textarea
                {...register('notes')}
                id='notes'
                rows={3}
                className={cn(
                  'mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm',
                  errors.notes
                    ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                )}
                placeholder='Dodatkowe informacje o produkcie...'
              />
              {errors.notes && <p className='mt-1 text-sm text-red-600'>{errors.notes.message}</p>}
            </div>
          </div>

          {/* Form Actions */}
          <div className='flex justify-end space-x-3 border-t border-gray-200 pt-6'>
            {onCancel && (
              <button
                type='button'
                onClick={onCancel}
                className='rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none'>
                Anuluj
              </button>
            )}
            <button
              type='submit'
              disabled={isLoading}
              className='inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'>
              {isLoading ? (
                <>
                  <div className='mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white'></div>
                  Zapisywanie...
                </>
              ) : (
                <>
                  <BsCheck className='mr-2' />
                  {product ? 'Zapisz zmiany' : 'Dodaj produkt'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
