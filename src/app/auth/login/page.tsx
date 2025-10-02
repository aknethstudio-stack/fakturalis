'use client';

import HCaptchaComponent, { type HCaptchaRef } from '@/components/ui/HCaptcha';
import { useAuth } from '@/hooks/use-supabase';
import { logger } from '@/lib/logger';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  BsEye as Eye,
  BsEyeSlash as EyeOff,
  BsLock as Lock,
  BsBoxArrowInRight as LogIn,
  BsEnvelope as Mail,
} from 'react-icons/bs';

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const hcaptchaRef = useRef<HCaptchaRef>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signInWithEmail } = useAuth();
  const redirectTo = searchParams.get('redirectTo') || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    if (!captchaToken) {
      setError('root', {
        type: 'manual',
        message: 'Proszę zweryfikować captcha',
      });
      return;
    }

    try {
      setIsLoading(true);
      await signInWithEmail(data.email, data.password, { captchaToken });
      router.push(redirectTo);
    } catch (error) {
      logger.error('Login error', error, {
        email: data.email,
        component: 'LoginForm',
        redirectTo,
      });
      setError('root', {
        type: 'manual',
        message: error instanceof Error ? error.message : 'Błąd podczas logowania',
      });
      // Reset captcha po błędzie
      hcaptchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token);
  };

  const handleCaptchaError = () => {
    setCaptchaToken(null);
    setError('root', {
      type: 'manual',
      message: 'Błąd weryfikacji captcha. Spróbuj ponownie.',
    });
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8'>
      <div className='w-full max-w-md space-y-8'>
        {/* Header */}
        <div className='text-center'>
          <LogIn className='mx-auto h-12 w-12 text-blue-600' />
          <h2 className='mt-6 text-3xl font-extrabold text-gray-900'>Zaloguj się</h2>
          <p className='mt-2 text-sm text-gray-600'>
            Lub{' '}
            <Link href='/auth/signup' className='font-medium text-blue-600 transition-colors hover:text-blue-500'>
              załóż nowe konto
            </Link>
          </p>
        </div>

        {/* Form */}
        <form className='mt-8 space-y-6' onSubmit={handleSubmit(onSubmit)}>
          {/* Global Error */}
          {errors.root && (
            <div className='rounded-md bg-red-50 p-4'>
              <div className='text-sm text-red-700'>{errors.root.message}</div>
            </div>
          )}

          <div className='space-y-4'>
            {/* Email */}
            <div>
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

            {/* Password */}
            <div>
              <label htmlFor='password' className='block text-sm font-medium text-gray-700'>
                Hasło
              </label>
              <div className='relative mt-1'>
                <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
                  <Lock className='h-5 w-5 text-gray-400' />
                </div>
                <input
                  {...register('password')}
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  autoComplete='current-password'
                  className='relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 pr-10 pl-10 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm'
                  placeholder='Twoje hasło'
                />
                <button
                  type='button'
                  className='absolute inset-y-0 right-0 flex items-center pr-3'
                  onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff className='h-5 w-5 text-gray-400 hover:text-gray-600' />
                  ) : (
                    <Eye className='h-5 w-5 text-gray-400 hover:text-gray-600' />
                  )}
                </button>
              </div>
              {errors.password && <p className='mt-1 text-sm text-red-600'>{errors.password.message}</p>}
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className='flex items-center justify-between'>
            <Link href='/auth/reset-password' className='text-sm text-blue-600 transition-colors hover:text-blue-500'>
              Zapomniałeś hasła?
            </Link>
          </div>

          {/* hCaptcha */}
          <div className='flex justify-center'>
            <HCaptchaComponent ref={hcaptchaRef} onVerify={handleCaptchaVerify} onError={handleCaptchaError} />
          </div>

          {/* Submit Button */}
          <div>
            <button
              type='submit'
              disabled={isLoading || !captchaToken}
              className='group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'>
              {isLoading ? (
                <div className='h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent' />
              ) : (
                'Zaloguj się'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className='flex min-h-screen items-center justify-center'>Ładowanie...</div>}>
      <LoginForm />
    </Suspense>
  );
}
