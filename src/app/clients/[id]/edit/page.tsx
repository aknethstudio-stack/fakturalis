'use client';

import ClientForm from '@/components/forms/ClientForm';
import { useAuth, useSupabase } from '@/hooks/use-supabase';
import { logger } from '@/lib/logger';
import type { Database } from '@/types/database';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Client = Database['public']['Tables']['clients']['Row'];

export default function EditClientPage() {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const { user } = useAuth();
  const supabase = useSupabase();
  const params = useParams();
  const router = useRouter();

  const clientId = params.id as string;

  useEffect(() => {
    const fetchClient = async () => {
      if (!user || !clientId) return;

      try {
        setLoading(true);
        setError('');

        const { data, error: fetchError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .eq('owner_id', user.id)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            setError('Klient nie został znaleziony');
            return;
          }
          throw fetchError;
        }

        setClient(data);
      } catch (error) {
        logger.error('Failed to fetch client', error, {
          clientId,
          component: 'EditClientPage',
        });
        setError('Nie udało się pobrać danych klienta');
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [user, clientId, supabase]);

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <div className='mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8'>
          <div className='py-12 text-center'>
            <div className='inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600'></div>
            <p className='mt-2 text-sm text-gray-500'>Ładowanie danych klienta...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <div className='mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8'>
          <div className='rounded-md border border-red-200 bg-red-50 p-4'>
            <p className='text-sm text-red-800'>{error || 'Klient nie został znaleziony'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>Edytuj klienta</h1>
          <p className='mt-2 text-sm text-gray-700'>Aktualizuj dane kontaktowe i informacje o kliencie</p>
        </div>

        <div className='bg-white shadow sm:rounded-lg'>
          <div className='px-4 py-5 sm:p-6'>
            <ClientForm client={client} />
          </div>
        </div>
      </div>
    </div>
  );
}
