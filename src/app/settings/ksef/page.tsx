/**
 * KSeF Settings Page
 * Manage KSeF integration settings and connection
 */

import KSeFConnection from '@/components/ksef/KSeFConnection';
import { Suspense } from 'react';

export default function KSeFSettingsPage() {
  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'>
        {/* Page Header */}
        <div className='mb-6 rounded-lg bg-white shadow'>
          <div className='px-4 py-5 sm:p-6'>
            <div className='sm:flex sm:items-center sm:justify-between'>
              <div>
                <h1 className='text-2xl font-bold text-gray-900'>Ustawienia KSeF</h1>
                <p className='mt-1 text-sm text-gray-600'>Zarządzaj integracją z Krajowym Systemem e-Faktur</p>
              </div>
              <div className='mt-3 sm:mt-0'>
                <span className='inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800'>
                  Obowiązek od 2026
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          {/* Main Content */}
          <div className='lg:col-span-2'>
            <Suspense
              fallback={
                <div className='rounded-lg bg-white p-6 shadow'>
                  <div className='animate-pulse'>
                    <div className='mb-4 h-4 w-3/4 rounded bg-gray-200'></div>
                    <div className='mb-4 h-4 w-1/2 rounded bg-gray-200'></div>
                    <div className='mb-4 h-10 rounded bg-gray-200'></div>
                  </div>
                </div>
              }>
              <KSeFConnection />
            </Suspense>
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Information Card */}
            <div className='rounded-lg bg-white p-6 shadow'>
              <h3 className='mb-4 text-lg font-medium text-gray-900'>Czym jest KSeF?</h3>
              <div className='space-y-3 text-sm text-gray-600'>
                <p>
                  Krajowy System e-Faktur to platforma do przesyłania faktur w formacie elektronicznym, która stanie się
                  obowiązkowa dla przedsiębiorców od 1 stycznia 2026 roku.
                </p>
                <p>
                  InvoiceForge automatycznie przesyła faktury do KSeF po ich wystawieniu, zapewniając zgodność z
                  polskimi przepisami.
                </p>
              </div>
            </div>

            {/* Requirements Card */}
            <div className='rounded-lg border border-blue-200 bg-blue-50 p-6'>
              <h3 className='mb-4 text-lg font-medium text-blue-900'>Wymagania</h3>
              <div className='space-y-2 text-sm text-blue-800'>
                <div className='flex items-start'>
                  <svg className='mt-0.5 mr-2 h-4 w-4 flex-shrink-0' fill='currentColor' viewBox='0 0 20 20'>
                    <path
                      fillRule='evenodd'
                      d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                      clipRule='evenodd'
                    />
                  </svg>
                  <span>
                    Aktywny profil przedsiębiorcy na{' '}
                    <a href='https://ksef.mf.gov.pl' target='_blank' rel='noopener noreferrer' className='underline'>
                      ksef.mf.gov.pl
                    </a>
                  </span>
                </div>
                <div className='flex items-start'>
                  <svg className='mt-0.5 mr-2 h-4 w-4 flex-shrink-0' fill='currentColor' viewBox='0 0 20 20'>
                    <path
                      fillRule='evenodd'
                      d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                      clipRule='evenodd'
                    />
                  </svg>
                  <span>Prawidłowy NIP przedsiębiorcy</span>
                </div>
                <div className='flex items-start'>
                  <svg className='mt-0.5 mr-2 h-4 w-4 flex-shrink-0' fill='currentColor' viewBox='0 0 20 20'>
                    <path
                      fillRule='evenodd'
                      d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                      clipRule='evenodd'
                    />
                  </svg>
                  <span>Dane logowania do portalu KSeF</span>
                </div>
              </div>
            </div>

            {/* Status Card */}
            <div className='rounded-lg bg-white p-6 shadow'>
              <h3 className='mb-4 text-lg font-medium text-gray-900'>Status integracji</h3>
              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-gray-600'>Połączenie</span>
                  <span className='inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800'>
                    Sprawdzanie...
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-gray-600'>Środowisko</span>
                  <span className='inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800'>
                    {process.env.NODE_ENV === 'production' ? 'Produkcja' : 'Demo'}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-gray-600'>Ostatnia synchronizacja</span>
                  <span className='text-xs text-gray-500'>Nigdy</span>
                </div>
              </div>
            </div>

            {/* Help Card */}
            <div className='rounded-lg bg-white p-6 shadow'>
              <h3 className='mb-4 text-lg font-medium text-gray-900'>Potrzebujesz pomocy?</h3>
              <div className='space-y-3 text-sm text-gray-600'>
                <p>
                  Jeśli masz problemy z połączeniem KSeF, sprawdź naszą dokumentację lub skontaktuj się z pomocą
                  techniczną.
                </p>
                <div className='flex space-x-3'>
                  <a href='/docs/ksef' className='text-indigo-600 hover:text-indigo-500'>
                    Dokumentacja
                  </a>
                  <a href='/contact' className='text-indigo-600 hover:text-indigo-500'>
                    Kontakt
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Ustawienia KSeF - InvoiceForge',
  description: 'Zarządzaj integracją z Krajowym Systemem e-Faktur (KSeF)',
};
