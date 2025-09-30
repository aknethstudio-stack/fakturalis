'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-supabase';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/validations/auth';

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { resetPassword } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setIsLoading(true);
      await resetPassword(data.email);
      setEmailSent(true);
    } catch (error) {
      console.error('Reset password error:', error);
      setError('root', {
        type: 'manual',
        message: error instanceof Error ? error.message : 'Błąd podczas wysyłania emaila',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8'>
        <div className='w-full max-w-md space-y-8'>
          <div className='text-center'>
            <CheckCircle className='mx-auto h-16 w-16 text-green-600' />
            <h2 className='mt-6 text-3xl font-extrabold text-gray-900'>Email został wysłany</h2>
            <p className='mt-4 text-gray-600'>
              Sprawdź swoją skrzynkę pocztową i kliknij w link, aby zresetować hasło.
            </p>
            <Link href='/auth/login' className='mt-4 inline-flex items-center text-blue-600 hover:text-blue-500'>
              <ArrowLeft className='mr-2 h-4 w-4' />
              Wróć do logowania
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8'>
      <div className='w-full max-w-md space-y-8'>
        {/* Header */}
        <div className='text-center'>
          <Mail className='mx-auto h-12 w-12 text-blue-600' />
          <h2 className='mt-6 text-3xl font-extrabold text-gray-900'>Resetuj hasło</h2>
          <p className='mt-2 text-sm text-gray-600'>Wpisz swój adres email, a wyślemy Ci link do zresetowania hasła</p>
        </div>

        {/* Form */}
        <form className='mt-8 space-y-6' onSubmit={handleSubmit(onSubmit)}>
          {/* Global Error */}
          {errors.root && (
            <div className='rounded-md bg-red-50 p-4'>
              <div className='text-sm text-red-700'>{errors.root.message}</div>
            </div>
          )}

          <div>
            {/* Email */}
            <label htmlFor='email' className='block text-sm font-medium text-gray-700'>
              Email
            </label>
            <div className='relative mt-1'>
              <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
                <Mail className='h-5 w-5 text-gray-400' />
              </div>
              <input
                {...register('email')}
                id='email'
                type='email'
                autoComplete='email'
                className='relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 pl-10 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm'
                placeholder='nazwa@przykład.pl'
              />
            </div>
            {errors.email && <p className='mt-1 text-sm text-red-600'>{errors.email.message}</p>}
          </div>

          {/* Submit Button */}
          <div>
            <button
              type='submit'
              disabled={isLoading}
              className='group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'>
              {isLoading ? (
                <div className='h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent' />
              ) : (
                'Wyślij link resetujący'
              )}
            </button>
          </div>

          {/* Back to Login */}
          <div className='text-center'>
            <Link href='/auth/login' className='inline-flex items-center text-sm text-blue-600 hover:text-blue-500'>
              <ArrowLeft className='mr-2 h-4 w-4' />
              Wróć do logowania
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
