/**
 * KSeF Connection Form Component
 * Allows users to connect their KSeF portal credentials
 */

'use client';

import { logger } from '@/lib/logger';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const ksefConnectionSchema = z.object({
  nip: z
    .string()
    .min(1, 'NIP jest wymagany')
    .transform((val) => val.replace(/[-\s]/g, ''))
    .refine((val) => /^\d{10}$/.test(val), { message: 'NIP musi składać się z 10 cyfr' }),
  ksefLogin: z.string().min(1, 'Login KSeF jest wymagany').email('Podaj prawidłowy adres email'),
  ksefPassword: z.string().min(1, 'Hasło KSeF jest wymagane').min(8, 'Hasło musi mieć co najmniej 8 znaków'),
});

type KSeFConnectionForm = z.infer<typeof ksefConnectionSchema>;

interface KSeFConnectionStatus {
  connected: boolean;
  nip?: string;
  connectedAt?: string;
}

export default function KSeFConnection() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<KSeFConnectionStatus | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<KSeFConnectionForm>({
    resolver: zodResolver(ksefConnectionSchema),
  });

  const checkConnection = async () => {
    try {
      const response = await fetch('/api/ksef/connect');
      const data = await response.json();

      if (data.success) {
        setStatus({
          connected: data.connected,
          nip: data.data?.nip,
          connectedAt: data.data?.connectedAt,
        });
      }
    } catch (error) {
      logger.error('Failed to check KSeF connection', error, { component: 'KSeFConnection' });
    }
  };

  const onSubmit = async (data: KSeFConnectionForm) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/ksef/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess(result.message);
        reset();
        await checkConnection();
      } else {
        setError(result.error || 'Błąd podczas łączenia z KSeF');
      }
    } catch (error) {
      setError('Błąd sieci podczas łączenia z KSeF');
      logger.error('KSeF connection error', error, { component: 'KSeFConnection' });
    } finally {
      setIsLoading(false);
    }
  };

  // Check connection status on component mount
  useState(() => {
    checkConnection();
  });

  return (
    <div className='mx-auto max-w-md rounded-lg bg-white p-6 shadow-lg'>
      <div className='mb-6'>
        <h2 className='mb-2 text-2xl font-bold text-gray-900'>Połączenie z KSeF</h2>
        <p className='text-sm text-gray-600'>
          Połącz swoje konto KSeF, aby automatycznie przesyłać faktury zgodnie z polskim prawem.
        </p>
      </div>

      {status?.connected ? (
        <div className='mb-6 rounded-lg border border-green-200 bg-green-50 p-4'>
          <div className='flex items-center'>
            <div className='flex-shrink-0'>
              <svg className='h-5 w-5 text-green-400' viewBox='0 0 20 20' fill='currentColor'>
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                  clipRule='evenodd'
                />
              </svg>
            </div>
            <div className='ml-3'>
              <h3 className='text-sm font-medium text-green-800'>KSeF połączony</h3>
              <div className='mt-1 text-sm text-green-700'>
                <p>NIP: {status.nip}</p>
                {status.connectedAt && <p>Połączono: {new Date(status.connectedAt).toLocaleDateString('pl-PL')}</p>}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className='mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4'>
          <div className='flex'>
            <div className='flex-shrink-0'>
              <svg className='h-5 w-5 text-yellow-400' viewBox='0 0 20 20' fill='currentColor'>
                <path
                  fillRule='evenodd'
                  d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                  clipRule='evenodd'
                />
              </svg>
            </div>
            <div className='ml-3'>
              <h3 className='text-sm font-medium text-yellow-800'>KSeF nie jest połączony</h3>
              <p className='mt-1 text-sm text-yellow-700'>
                Aby automatycznie przesyłać faktury do KSeF, podaj swoje dane logowania.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className='mb-4 rounded-lg border border-red-200 bg-red-50 p-4'>
          <p className='text-sm text-red-800'>{error}</p>
        </div>
      )}

      {success && (
        <div className='mb-4 rounded-lg border border-green-200 bg-green-50 p-4'>
          <p className='text-sm text-green-800'>{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
        <div>
          <label htmlFor='nip' className='block text-sm font-medium text-gray-700'>
            NIP *
          </label>
          <input
            {...register('nip')}
            type='text'
            id='nip'
            placeholder='0000000000'
            className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none'
          />
          {errors.nip && <p className='mt-1 text-sm text-red-600'>{errors.nip.message}</p>}
        </div>

        <div>
          <label htmlFor='ksefLogin' className='block text-sm font-medium text-gray-700'>
            Login KSeF (email) *
          </label>
          <input
            {...register('ksefLogin')}
            type='email'
            id='ksefLogin'
            placeholder='twoj.email@example.com'
            className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none'
          />
          {errors.ksefLogin && <p className='mt-1 text-sm text-red-600'>{errors.ksefLogin.message}</p>}
        </div>

        <div>
          <label htmlFor='ksefPassword' className='block text-sm font-medium text-gray-700'>
            Hasło KSeF *
          </label>
          <input
            {...register('ksefPassword')}
            type='password'
            id='ksefPassword'
            placeholder='Twoje hasło KSeF'
            className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none'
          />
          {errors.ksefPassword && <p className='mt-1 text-sm text-red-600'>{errors.ksefPassword.message}</p>}
        </div>

        <div className='pt-4'>
          <button
            type='submit'
            disabled={isLoading || status?.connected}
            className='flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'>
            {isLoading ? (
              <>
                <svg
                  className='mr-3 -ml-1 h-5 w-5 animate-spin text-white'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'>
                  <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                </svg>
                Łączenie...
              </>
            ) : status?.connected ? (
              'Połączono'
            ) : (
              'Połącz z KSeF'
            )}
          </button>
        </div>
      </form>

      <div className='mt-6 border-t border-gray-200 pt-4'>
        <div className='text-xs text-gray-500'>
          <p className='mb-2'>
            <strong>Gdzie znaleźć dane logowania?</strong>
          </p>
          <ul className='list-inside list-disc space-y-1'>
            <li>
              Przejdź na portal{' '}
              <a
                href='https://ksef.mf.gov.pl'
                target='_blank'
                rel='noopener noreferrer'
                className='text-indigo-600 hover:underline'>
                ksef.mf.gov.pl
              </a>
            </li>
            <li>Zaloguj się swoimi danymi</li>
            <li>Użyj tych samych danych tutaj</li>
          </ul>
          <p className='mt-2 text-xs'>⚠️ Dane są szyfrowane i używane tylko do komunikacji z KSeF.</p>
        </div>
      </div>
    </div>
  );
}
