'use client';

import InvoiceForm from '@/components/forms/InvoiceForm';
import { useRouter } from 'next/navigation';

export default function NewInvoicePage() {
  const router = useRouter();

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold text-gray-900'>Nowa faktura</h1>
        <p className='mt-2 text-sm text-gray-600'>Utwórz nową fakturę dla swojego klienta</p>
      </div>

      <InvoiceForm
        onSuccess={() => typeof window !== 'undefined' && router.push('/invoices')}
        onCancel={() => typeof window !== 'undefined' && router.push('/invoices')}
      />
    </div>
  );
}
