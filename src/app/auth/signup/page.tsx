'use client';

import AnimatedInput from '@/components/ui/AnimatedInput';
import HCaptchaComponent, { type HCaptchaRef } from '@/components/ui/HCaptcha';
import PasswordStrength from '@/components/ui/PasswordStrength';
import { useAuth } from '@/hooks/use-supabase';
import { signupSchema, type SignupFormData } from '@/lib/validations/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  BsEye as Eye,
  BsEyeSlash as EyeOff,
  BsLock as Lock,
  BsEnvelope as Mail,
  BsPersonPlus as UserPlus,
} from 'react-icons/bs';

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [_password, _setPassword] = useState('');
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);
  const captchaRef = useRef<HCaptchaRef>(null);
  const router = useRouter();
  const { signUpWithEmail } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const passwordValue = watch('password', '');

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token);
  };

  const handleCaptchaError = () => {
    setCaptchaToken(null);
  };

  const onSubmit = async (data: SignupFormData) => {
    if (!captchaToken) {
      setError('root', { message: 'Potwierdź, że nie jesteś robotem' });
      return;
    }

    try {
      setIsLoading(true);
      await signUpWithEmail(data.email, data.password, { captchaToken });
      router.push('/auth/login?message=Sprawdź swój email i potwierdź konto');
    } catch (error) {
      console.error('Signup error:', error);
      setError('root', {
        type: 'manual',
        message: error instanceof Error ? error.message : 'Błąd podczas rejestracji',
      });
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8'>
      <div className='w-full max-w-md space-y-8'>
        {/* Header */}
        <div className='text-center'>
          <UserPlus className='mx-auto h-12 w-12 text-blue-600' />
          <h2 className='mt-6 text-3xl font-extrabold text-gray-900'>Załóż konto</h2>
          <p className='mt-2 text-sm text-gray-600'>
            Lub{' '}
            <Link href='/auth/login' className='font-medium text-blue-600 transition-colors hover:text-blue-500'>
              zaloguj się na istniejące konto
            </Link>
          </p>
        </div>

        {/* Form */}
        <form className='animate-slide-up mt-8 space-y-6' onSubmit={handleSubmit(onSubmit)}>
          {/* Global Error */}
          {errors.root && (
            <div className='animate-fade-in rounded-md bg-red-50 p-4'>
              <div className='text-sm text-red-700'>{errors.root.message}</div>
            </div>
          )}

          <div className='space-y-6'>
            {/* Email */}
            <AnimatedInput
              {...register('email')}
              label='Email'
              type='email'
              placeholder='nazwa@przykład.pl'
              icon={<Mail className='h-5 w-5' />}
              error={errors.email?.message}
              autoComplete='email'
            />

            {/* Password */}
            <div>
              <AnimatedInput
                {...register('password')}
                label='Hasło'
                type={showPassword ? 'text' : 'password'}
                placeholder='Co najmniej 8 znaków'
                icon={<Lock className='h-5 w-5' />}
                rightIcon={
                  <button
                    type='button'
                    className='text-gray-400 transition-colors hover:text-gray-600'
                    onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className='h-5 w-5' /> : <Eye className='h-5 w-5' />}
                  </button>
                }
                error={errors.password?.message}
                autoComplete='new-password'
                onFocus={() => setShowPasswordStrength(true)}
              />
              <PasswordStrength password={passwordValue} show={showPasswordStrength} />
            </div>

            {/* Confirm Password */}
            <AnimatedInput
              {...register('confirmPassword')}
              label='Potwierdź hasło'
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder='Powtórz hasło'
              icon={<Lock className='h-5 w-5' />}
              rightIcon={
                <button
                  type='button'
                  className='text-gray-400 transition-colors hover:text-gray-600'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <EyeOff className='h-5 w-5' /> : <Eye className='h-5 w-5' />}
                </button>
              }
              error={errors.confirmPassword?.message}
              autoComplete='new-password'
            />
          </div>

          {/* Terms */}
          <div className='text-sm text-gray-600'>
            Tworząc konto akceptujesz nasze{' '}
            <Link href='/terms' className='text-blue-600 hover:text-blue-500'>
              Warunki świadczenia usług
            </Link>{' '}
            i{' '}
            <Link href='/privacy' className='text-blue-600 hover:text-blue-500'>
              Politykę prywatności
            </Link>
          </div>

          {/* hCaptcha */}
          <div className='flex justify-center'>
            <HCaptchaComponent ref={captchaRef} onVerify={handleCaptchaVerify} onError={handleCaptchaError} />
          </div>

          {/* Submit Button */}
          <div>
            <button
              type='submit'
              disabled={isLoading}
              className='group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none'>
              {isLoading ? (
                <div className='h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent' />
              ) : (
                <>
                  <UserPlus className='mr-2 h-5 w-5' />
                  Załóż konto
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
