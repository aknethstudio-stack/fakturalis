'use client';

import { useAuth, useSupabase } from '@/hooks/use-supabase';
import { logger } from '@/lib/logger';
import { cn, validateNIP } from '@/lib/utils';
import { formatNIP, formatPhone } from '@/lib/validations/client';
import type { ClientFormData, Database } from '@/types/database';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { BsBuilding, BsCheck, BsEnvelope, BsGeoAlt, BsPerson, BsX } from 'react-icons/bs';
import { z } from 'zod';

type Client = Database['public']['Tables']['clients']['Row'];

// Form validation schema - kept for future reference
const _clientFormSchema = z.object({
  name: z.string().min(1, 'Nazwa klienta jest wymagana').max(255, 'Nazwa nie może być dłuższa niż 255 znaków'),
  vat_id: z.string().optional(),
  email: z.string().email('Nieprawidłowy adres email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  postal_code: z
    .string()
    .refine(
      (val) => {
        if (!val) return true;
        return /^\d{2}-\d{3}$/.test(val);
      },
      { message: 'Kod pocztowy powinien być w formacie XX-XXX' },
    )
    .optional(),
  city: z.string().optional(),
  country_code: z.string().optional(),
  notes: z.string().max(1000, 'Notatki nie mogą być dłuższe niż 1000 znaków').optional(),
});

interface ClientFormProps {
  client?: Client;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ClientForm({ client, onSuccess, onCancel }: ClientFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const { user } = useAuth();
  const supabase = useSupabase();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    setError,
  } = useForm<ClientFormData>({
    defaultValues: client
      ? {
          name: client.name,
          vat_id: client.vat_id || '',
          email: client.email || '',
          phone: client.phone || '',
          address_line1: client.address_line1 || '',
          address_line2: client.address_line2 || '',
          postal_code: client.postal_code || '',
          city: client.city || '',
          country_code: client.country_code || 'PL',
          notes: client.notes || '',
        }
      : {
          country_code: 'PL',
        },
  });

  // Format NIP on blur
  const handleNIPBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const formatted = formatNIP(e.target.value);
    setValue('vat_id', formatted);
  };

  // Format phone on blur
  const handlePhoneBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setValue('phone', formatted);
  };

  const onSubmit = async (data: ClientFormData) => {
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
          message: 'Nazwa klienta jest wymagana',
        });
        return;
      }

      // Validate NIP if provided
      if (data.vat_id && data.vat_id.trim() && !validateNIP(data.vat_id)) {
        setError('vat_id', {
          type: 'manual',
          message: 'Nieprawidłowy format NIP',
        });
        return;
      }

      // Validate email if provided
      if (data.email && data.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        setError('email', {
          type: 'manual',
          message: 'Nieprawidłowy adres email',
        });
        return;
      }

      // Validate postal code if provided
      if (data.postal_code && data.postal_code.trim() && !/^\d{2}-\d{3}$/.test(data.postal_code)) {
        setError('postal_code', {
          type: 'manual',
          message: 'Kod pocztowy powinien być w formacie XX-XXX',
        });
        return;
      }

      // Prepare clean data for database
      const cleanData = {
        name: data.name.trim(),
        vat_id: data.vat_id ? data.vat_id.replace(/[-\s]/g, '') : null,
        email: data.email || null,
        phone: data.phone || null,
        address_line1: data.address_line1 || null,
        address_line2: data.address_line2 || null,
        postal_code: data.postal_code || null,
        city: data.city || null,
        country_code: data.country_code || 'PL',
        notes: data.notes || null,
      };

      if (client) {
        // Update existing client
        const { error: updateError } = await supabase
          .from('clients')
          .update({
            ...cleanData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', client.id)
          .eq('owner_id', user.id);

        if (updateError) {
          throw updateError;
        }

        logger.info('Client updated successfully', { clientId: client.id });
      } else {
        // Create new client
        const { error: insertError } = await supabase.from('clients').insert({
          ...cleanData,
          owner_id: user.id,
        });

        if (insertError) {
          throw insertError;
        }

        logger.info('Client created successfully');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/clients');
      }
    } catch (error) {
      logger.error('Client form submission error', error, {
        component: 'ClientForm',
        isUpdate: !!client,
      });
      setSubmitError(error instanceof Error ? error.message : 'Wystąpił błąd podczas zapisywania klienta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='mx-auto max-w-4xl'>
      <div className='rounded-lg bg-white shadow-sm'>
        <div className='border-b border-gray-200 px-6 py-4'>
          <h2 className='flex items-center text-lg font-medium text-gray-900'>
            <BsPerson className='mr-2' />
            {client ? 'Edytuj klienta' : 'Dodaj nowego klienta'}
          </h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6 p-6'>
          {submitError && (
            <div className='rounded-md border border-red-200 bg-red-50 p-4'>
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
              <BsBuilding className='mr-2' />
              Podstawowe informacje
            </h3>

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <div className='sm:col-span-2'>
                <label htmlFor='name' className='block text-sm font-medium text-gray-700'>
                  Nazwa klienta *
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
                  placeholder='Nazwa firmy lub imię i nazwisko'
                />
                {errors.name && <p className='mt-1 text-sm text-red-600'>{errors.name.message}</p>}
              </div>

              <div>
                <label htmlFor='vat_id' className='block text-sm font-medium text-gray-700'>
                  NIP
                </label>
                <input
                  {...register('vat_id')}
                  type='text'
                  id='vat_id'
                  onBlur={handleNIPBlur}
                  className={cn(
                    'mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm',
                    errors.vat_id
                      ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                  )}
                  placeholder='000-000-00-00'
                />
                {errors.vat_id && <p className='mt-1 text-sm text-red-600'>{errors.vat_id.message}</p>}
              </div>

              <div>
                <label htmlFor='country_code' className='block text-sm font-medium text-gray-700'>
                  Kraj
                </label>
                <select
                  {...register('country_code')}
                  id='country_code'
                  className='mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm'>
                  <option value='PL'>Polska</option>
                  <option value='DE'>Niemcy</option>
                  <option value='CZ'>Czechy</option>
                  <option value='SK'>Słowacja</option>
                  <option value='UA'>Ukraina</option>
                  <option value='GB'>Wielka Brytania</option>
                  <option value='US'>Stany Zjednoczone</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className='space-y-4'>
            <h3 className='text-md flex items-center font-medium text-gray-900'>
              <BsEnvelope className='mr-2' />
              Kontakt
            </h3>

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <div>
                <label htmlFor='email' className='block text-sm font-medium text-gray-700'>
                  Adres email
                </label>
                <input
                  {...register('email')}
                  type='email'
                  id='email'
                  className={cn(
                    'mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm',
                    errors.email
                      ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                  )}
                  placeholder='email@example.com'
                />
                {errors.email && <p className='mt-1 text-sm text-red-600'>{errors.email.message}</p>}
              </div>

              <div>
                <label htmlFor='phone' className='block text-sm font-medium text-gray-700'>
                  Telefon
                </label>
                <input
                  {...register('phone')}
                  type='tel'
                  id='phone'
                  onBlur={handlePhoneBlur}
                  className={cn(
                    'mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm',
                    errors.phone
                      ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                  )}
                  placeholder='123 456 789'
                />
                {errors.phone && <p className='mt-1 text-sm text-red-600'>{errors.phone.message}</p>}
              </div>
            </div>
          </div>

          {/* Address */}
          <div className='space-y-4'>
            <h3 className='text-md flex items-center font-medium text-gray-900'>
              <BsGeoAlt className='mr-2' />
              Adres
            </h3>

            <div className='space-y-4'>
              <div>
                <label htmlFor='address_line1' className='block text-sm font-medium text-gray-700'>
                  Ulica i numer
                </label>
                <input
                  {...register('address_line1')}
                  type='text'
                  id='address_line1'
                  className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm'
                  placeholder='ul. Przykładowa 123'
                />
              </div>

              <div>
                <label htmlFor='address_line2' className='block text-sm font-medium text-gray-700'>
                  Dodatkowe informacje adresowe
                </label>
                <input
                  {...register('address_line2')}
                  type='text'
                  id='address_line2'
                  className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm'
                  placeholder='Mieszkanie 4, II piętro'
                />
              </div>

              <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
                <div>
                  <label htmlFor='postal_code' className='block text-sm font-medium text-gray-700'>
                    Kod pocztowy
                  </label>
                  <input
                    {...register('postal_code')}
                    type='text'
                    id='postal_code'
                    className={cn(
                      'mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm',
                      errors.postal_code
                        ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                    )}
                    placeholder='00-000'
                  />
                  {errors.postal_code && <p className='mt-1 text-sm text-red-600'>{errors.postal_code.message}</p>}
                </div>

                <div className='sm:col-span-2'>
                  <label htmlFor='city' className='block text-sm font-medium text-gray-700'>
                    Miasto
                  </label>
                  <input
                    {...register('city')}
                    type='text'
                    id='city'
                    className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm'
                    placeholder='Warszawa'
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
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
              placeholder='Dodatkowe informacje o kliencie...'
            />
            {errors.notes && <p className='mt-1 text-sm text-red-600'>{errors.notes.message}</p>}
          </div>

          {/* Actions */}
          <div className='flex justify-end space-x-3 border-t border-gray-200 pt-6'>
            <button
              type='button'
              onClick={onCancel || (() => router.push('/clients'))}
              className='rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none'>
              Anuluj
            </button>
            <button
              type='submit'
              disabled={isLoading}
              className='flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'>
              {isLoading ? (
                <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
              ) : (
                <BsCheck className='mr-2' />
              )}
              {client ? 'Zapisz zmiany' : 'Dodaj klienta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
