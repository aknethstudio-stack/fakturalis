'use client';

import ProductForm from '@/components/forms/ProductForm';
import Link from 'next/link';

export default function NewProductPage() {
  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='mb-6'>
        <Link href='/products' className='inline-flex items-center text-sm text-gray-600 hover:text-gray-900'>
          ← Powrót do listy produktów
        </Link>
      </div>

      <div className='mb-6'>
        <h1 className='text-3xl font-bold text-gray-900'>Dodaj nowy produkt</h1>
        <p className='mt-2 text-sm text-gray-600'>Stwórz nowy produkt lub usługę w swoim katalogu</p>
      </div>

      <ProductForm />
    </div>
  );
}
