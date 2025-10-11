'use client';

import ProductForm from '@/components/forms/ProductForm';
import { useAuth, useSupabase } from '@/hooks/use-supabase';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { formatPrice, formatVATRate } from '@/lib/validations/product';
import type { Database } from '@/types/database';
import { useCallback, useEffect, useState } from 'react';
import { BsBoxSeam, BsEye, BsEyeSlash, BsPencil, BsPlus, BsSearch, BsTrash, BsX } from 'react-icons/bs';

type Product = Database['public']['Tables']['products']['Row'];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { user } = useAuth();
  const supabase = useSupabase();

  const fetchProducts = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      let query = supabase.from('products').select('*').eq('owner_id', user.id).order('name');

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`);
      }

      if (!showInactive) {
        query = query.eq('active', true);
      }

      const { data, error: queryError } = await query;

      if (queryError) {
        logger.error('Failed to fetch products', queryError, { component: 'ProductsPage' });
        setError('Nie udało się pobrać listy produktów');
        return;
      }

      setProducts(data || []);
    } catch (error) {
      logger.error('Failed to fetch products', error, { component: 'ProductsPage' });
      setError('Nie udało się pobrać listy produktów');
    } finally {
      setLoading(false);
    }
  }, [user, searchTerm, showInactive, supabase]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleProductSaved = (_product: Product) => {
    setShowForm(false);
    setEditingProduct(null);
    fetchProducts(); // Refresh list
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = async (productId: string) => {
    if (!user) return;

    try {
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('owner_id', user.id);

      if (deleteError) {
        logger.error('Failed to delete product', deleteError, { productId, component: 'ProductsPage' });
        setError('Nie udało się usunąć produktu');
        return;
      }

      logger.info('Product deleted successfully', { productId });
      setDeleteConfirm(null);
      fetchProducts(); // Refresh list
    } catch (error) {
      logger.error('Failed to delete product', error, { productId, component: 'ProductsPage' });
      setError('Nie udało się usunąć produktu');
    }
  };

  const filteredProducts = products.filter((product) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return product.name.toLowerCase().includes(search) || product.sku?.toLowerCase().includes(search) || false;
  });

  if (showForm) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='mb-6'>
          <button
            onClick={() => {
              setShowForm(false);
              setEditingProduct(null);
            }}
            className='inline-flex items-center text-sm text-gray-600 hover:text-gray-900'>
            ← Powrót do listy produktów
          </button>
        </div>
        <ProductForm
          product={editingProduct}
          onSuccess={handleProductSaved}
          onCancel={() => {
            setShowForm(false);
            setEditingProduct(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      {/* Header */}
      <div className='mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='flex items-center text-3xl font-bold text-gray-900'>
            <BsBoxSeam className='mr-3' />
            Produkty
          </h1>
          <p className='mt-2 text-sm text-gray-600'>Zarządzaj katalogiem produktów i usług</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className='mt-4 inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none sm:mt-0'>
          <BsPlus className='mr-2' />
          Dodaj produkt
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className='mb-6 rounded-md border border-red-200 bg-red-50 p-4' role='alert'>
          <div className='flex'>
            <BsX className='h-5 w-5 text-red-400' />
            <div className='ml-3'>
              <p className='text-sm text-red-800'>{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className='mb-6 rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200'>
        <div className='flex flex-col gap-4 sm:flex-row'>
          <div className='relative flex-1'>
            <BsSearch className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
            <input
              type='text'
              placeholder='Szukaj produktów...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='block w-full rounded-md border border-gray-300 px-3 py-2 pl-10 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm'
            />
          </div>
          <div className='flex items-center'>
            <input
              id='show-inactive'
              type='checkbox'
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className='h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
            />
            <label htmlFor='show-inactive' className='ml-2 block text-sm text-gray-900'>
              Pokaż nieaktywne
            </label>
          </div>
        </div>
      </div>

      {/* Products List */}
      <div className='rounded-lg bg-white shadow-sm ring-1 ring-gray-200'>
        {loading ? (
          <div className='p-6 text-center'>
            <div className='inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600'></div>
            <p className='mt-2 text-sm text-gray-600'>Ładowanie produktów...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className='p-6 text-center'>
            <BsBoxSeam className='mx-auto h-12 w-12 text-gray-400' />
            <h3 className='mt-2 text-sm font-medium text-gray-900'>Brak produktów</h3>
            <p className='mt-1 text-sm text-gray-500'>
              {searchTerm
                ? 'Nie znaleziono produktów pasujących do wyszukiwania.'
                : 'Zacznij od dodania swojego pierwszego produktu lub usługi.'}
            </p>
            {!searchTerm && (
              <div className='mt-6'>
                <button
                  onClick={() => setShowForm(true)}
                  className='inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none'>
                  <BsPlus className='mr-2' />
                  Dodaj pierwszy produkt
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className='overflow-hidden'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                    Produkt
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                    SKU
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                    Jednostka
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                    Cena
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                    VAT
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                    Status
                  </th>
                  <th className='px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase'>
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200 bg-white'>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className='hover:bg-gray-50'>
                    <td className='px-6 py-4'>
                      <div>
                        <div className='text-sm font-medium text-gray-900'>{product.name}</div>
                        {product.notes && (
                          <div className='max-w-xs truncate text-sm text-gray-500'>{product.notes}</div>
                        )}
                      </div>
                    </td>
                    <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-900'>{product.sku || '-'}</td>
                    <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-900'>{product.unit}</td>
                    <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-900'>
                      {formatPrice(product.unit_price, product.currency)}
                    </td>
                    <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-900'>
                      {formatVATRate(product.vat_rate_default)}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                          product.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800',
                        )}>
                        {product.active ? <BsEye className='mr-1 h-3 w-3' /> : <BsEyeSlash className='mr-1 h-3 w-3' />}
                        {product.active ? 'Aktywny' : 'Nieaktywny'}
                      </span>
                    </td>
                    <td className='space-x-2 px-6 py-4 text-right text-sm font-medium whitespace-nowrap'>
                      <button
                        onClick={() => handleEdit(product)}
                        className='text-indigo-600 hover:text-indigo-900'
                        title='Edytuj produkt'>
                        <BsPencil className='h-4 w-4' />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(product.id)}
                        className='text-red-600 hover:text-red-900'
                        title='Usuń produkt'>
                        <BsTrash className='h-4 w-4' />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className='bg-opacity-50 fixed inset-0 z-50 h-full w-full overflow-y-auto bg-gray-600'>
          <div className='relative top-20 mx-auto w-96 rounded-md border bg-white p-5 shadow-lg'>
            <div className='mt-3 text-center'>
              <h3 className='text-lg font-medium text-gray-900'>Usuń produkt</h3>
              <div className='mt-2 px-7 py-3'>
                <p className='text-sm text-gray-500'>
                  Czy na pewno chcesz usunąć ten produkt? Ta akcja jest nieodwracalna.
                </p>
              </div>
              <div className='items-center space-x-3 px-4 py-3'>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className='rounded-md bg-gray-500 px-4 py-2 text-base font-medium text-white hover:bg-gray-600 focus:ring-2 focus:ring-gray-300 focus:outline-none'>
                  Anuluj
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className='rounded-md bg-red-500 px-4 py-2 text-base font-medium text-white hover:bg-red-600 focus:ring-2 focus:ring-red-300 focus:outline-none'>
                  Usuń
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
