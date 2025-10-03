'use client';

import ClientForm from '@/components/forms/ClientForm';

export default function NewClientPage() {
  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>Dodaj nowego klienta</h1>
          <p className='mt-2 text-sm text-gray-700'>Wprowadź dane kontaktowe i informacje o kliencie</p>
        </div>

        <div className='bg-white shadow sm:rounded-lg'>
          <div className='px-4 py-5 sm:p-6'>
            <ClientForm />
          </div>
        </div>
      </div>
    </div>
  );
}
