'use client';

import { useAuth, useSupabase } from '@/hooks/use-supabase';
import { logger } from '@/lib/logger';
import type { Database } from '@/types/database';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { BsBuilding, BsEnvelope, BsGeoAlt, BsPencil, BsPlus, BsSearch, BsTelephone, BsTrash } from 'react-icons/bs';

type Client = Database['public']['Tables']['clients']['Row'];

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { user } = useAuth();
  const supabase = useSupabase();
  const router = useRouter();

  const fetchClients = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      let query = supabase.from('clients').select('*').eq('owner_id', user.id).order('name');

      if (searchTerm.trim()) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,vat_id.ilike.%${searchTerm}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setClients(data || []);
    } catch (error) {
      logger.error('Failed to fetch clients', error, { component: 'ClientsPage' });
      setError('Nie udało się pobrać listy klientów');
    } finally {
      setLoading(false);
    }
  }, [user, searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (clientId: string) => {
    if (!user) return;

    try {
      const { error: deleteError } = await supabase.from('clients').delete().eq('id', clientId).eq('owner_id', user.id);

      if (deleteError) {
        throw deleteError;
      }

      logger.info('Client deleted successfully', { clientId });
      setDeleteConfirm(null);
      fetchClients(); // Refresh list
    } catch (error) {
      logger.error('Failed to delete client', error, { clientId, component: 'ClientsPage' });
      setError('Nie udało się usunąć klienta');
    }
  };

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='sm:flex sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>Klienci</h1>
            <p className='mt-2 text-sm text-gray-700'>Zarządzanie bazą klientów i ich danymi kontaktowymi</p>
          </div>
          <div className='mt-4 sm:mt-0'>
            <Link
              href='/clients/new'
              className='inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none'>
              <BsPlus className='mr-2 h-4 w-4' />
              Dodaj klienta
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className='mt-8'>
          <div className='relative'>
            <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
              <BsSearch className='h-5 w-5 text-gray-400' />
            </div>
            <input
              type='text'
              placeholder='Szukaj klientów po nazwie, emailu lub NIP...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='block w-full rounded-md border border-gray-300 bg-white py-2 pr-3 pl-10 leading-5 placeholder-gray-500 focus:border-indigo-500 focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:outline-none sm:text-sm'
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className='mt-4 rounded-md border border-red-200 bg-red-50 p-4'>
            <p className='text-sm text-red-800'>{error}</p>
          </div>
        )}

        {/* Content */}
        <div className='mt-8'>
          {loading ? (
            <div className='py-12 text-center'>
              <div className='inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600'></div>
              <p className='mt-2 text-sm text-gray-500'>Ładowanie klientów...</p>
            </div>
          ) : clients.length === 0 ? (
            <div className='py-12 text-center'>
              <BsBuilding className='mx-auto h-12 w-12 text-gray-400' />
              <h3 className='mt-4 text-sm font-medium text-gray-900'>Brak klientów</h3>
              <p className='mt-1 text-sm text-gray-500'>
                {searchTerm
                  ? 'Nie znaleziono klientów spełniających kryteria wyszukiwania.'
                  : 'Zacznij od dodania pierwszego klienta.'}
              </p>
              {!searchTerm && (
                <div className='mt-6'>
                  <Link
                    href='/clients/new'
                    className='inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none'>
                    <BsPlus className='mr-2 h-4 w-4' />
                    Dodaj pierwszego klienta
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className='overflow-hidden bg-white shadow sm:rounded-md'>
              <ul className='divide-y divide-gray-200'>
                {clients.map((client) => (
                  <li key={client.id}>
                    <div className='px-4 py-4 sm:px-6'>
                      <div className='flex items-center justify-between'>
                        <div className='flex-1'>
                          <div className='flex items-center'>
                            <h3 className='flex items-center text-lg font-medium text-gray-900'>
                              <BsBuilding className='mr-2 h-5 w-5 text-gray-400' />
                              {client.name}
                            </h3>
                            {client.vat_id && (
                              <span className='ml-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800'>
                                NIP: {client.vat_id}
                              </span>
                            )}
                          </div>

                          <div className='mt-2 sm:flex sm:justify-between'>
                            <div className='sm:flex sm:space-x-6'>
                              {client.email && (
                                <div className='flex items-center text-sm text-gray-500'>
                                  <BsEnvelope className='mr-1.5 h-4 w-4' />
                                  {client.email}
                                </div>
                              )}
                              {client.phone && (
                                <div className='mt-2 flex items-center text-sm text-gray-500 sm:mt-0'>
                                  <BsTelephone className='mr-1.5 h-4 w-4' />
                                  {client.phone}
                                </div>
                              )}
                            </div>

                            {(client.city || client.country_code) && (
                              <div className='mt-2 flex items-center text-sm text-gray-500 sm:mt-0'>
                                <BsGeoAlt className='mr-1.5 h-4 w-4' />
                                {[client.city, client.country_code].filter(Boolean).join(', ')}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className='ml-4 flex items-center space-x-2'>
                          <Link
                            href={`/clients/${client.id}/edit`}
                            className='rounded-full p-2 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600'
                            title='Edytuj klienta'>
                            <BsPencil className='h-4 w-4' />
                          </Link>

                          {deleteConfirm === client.id ? (
                            <div className='flex items-center space-x-2'>
                              <button
                                onClick={() => handleDelete(client.id)}
                                className='rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700'>
                                Potwierdź
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className='rounded bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200'>
                                Anuluj
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(client.id)}
                              className='rounded-full p-2 text-gray-400 hover:bg-red-50 hover:text-red-600'
                              title='Usuń klienta'>
                              <BsTrash className='h-4 w-4' />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
