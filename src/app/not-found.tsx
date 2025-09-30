'use client';

import Link from 'next/link';
import { FileX, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50 px-4'>
      <div className='w-full max-w-md text-center'>
        {/* Icon */}
        <div className='mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100'>
          <FileX className='h-12 w-12 text-gray-400' />
        </div>

        {/* Error Code */}
        <h1 className='mb-2 text-6xl font-bold text-gray-900'>404</h1>

        {/* Error Message */}
        <h2 className='mb-4 text-2xl font-semibold text-gray-700'>Strona nie została znaleziona</h2>

        <p className='mb-8 leading-relaxed text-gray-600'>
          Przepraszamy, ale strona której szukasz nie istnieje lub została przeniesiona. Sprawdź poprawność adresu URL
          lub wróć na stronę główną.
        </p>

        {/* Action Buttons */}
        <div className='flex flex-col justify-center gap-4 sm:flex-row'>
          <Link
            href='/'
            className='bg-brand hover:bg-brand-600 focus:ring-brand-500 inline-flex items-center justify-center rounded-lg px-6 py-3 font-medium text-white transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none'>
            <Home className='mr-2 h-5 w-5' />
            Strona główna
          </Link>

          <button
            onClick={() => window.history.back()}
            className='inline-flex items-center justify-center rounded-lg bg-gray-100 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none'>
            <ArrowLeft className='mr-2 h-5 w-5' />
            Wróć
          </button>
        </div>

        {/* Additional Links */}
        <div className='mt-12 border-t border-gray-200 pt-8'>
          <p className='mb-4 text-sm text-gray-500'>Możesz też sprawdzić:</p>
          <div className='flex flex-wrap justify-center gap-6 text-sm'>
            <Link href='/invoices' className='text-brand hover:text-brand-600 transition-colors'>
              Faktury
            </Link>
            <Link href='/clients' className='text-brand hover:text-brand-600 transition-colors'>
              Klienci
            </Link>
            <Link href='/settings' className='text-brand hover:text-brand-600 transition-colors'>
              Ustawienia
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
