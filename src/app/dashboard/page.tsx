'use client';

import { useAuth, useSupabase } from '@/hooks/use-supabase';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/database';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { BsBarChart, BsCalendarEvent, BsCashStack, BsCreditCard, BsFileEarmarkText, BsPeople } from 'react-icons/bs';

type Invoice = Database['public']['Tables']['invoices']['Row'];
type Client = Database['public']['Tables']['clients']['Row'];

interface DashboardStats {
  totalRevenue: number;
  totalInvoices: number;
  totalClients: number;
  overduePayments: number;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  recentInvoices: Array<Invoice & { client: Client }>;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  color: 'blue' | 'green' | 'orange' | 'red';
}

function StatCard({ title, value, icon: Icon, trend, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    red: 'bg-red-50 text-red-600 border-red-200',
  };

  return (
    <div className='rounded-lg border bg-white p-6 shadow-sm'>
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-sm font-medium text-gray-600'>{title}</p>
          <p className='text-2xl font-bold text-gray-900'>{value}</p>
          {trend && (
            <p className='text-sm text-gray-500'>
              <span className='text-green-600'>↑ {trend}</span> vs ostatni miesiąc
            </p>
          )}
        </div>
        <div className={cn('rounded-full border-2 p-3', colorClasses[color])}>
          <Icon className='h-6 w-6' />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useSupabase();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalInvoices: 0,
    totalClients: 0,
    overduePayments: 0,
    monthlyRevenue: [],
    recentInvoices: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user && typeof window !== 'undefined') {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  const fetchDashboardStats = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      // Fetch total revenue
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('total_gross, status, due_date, created_at')
        .eq('owner_id', user.id);

      if (invoiceError) throw invoiceError;

      // Fetch clients count
      const { count: clientsCount, error: clientsError } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id);

      if (clientsError) throw clientsError;

      // Fetch recent invoices with client data
      const { data: recentInvoicesData, error: recentError } = await supabase
        .from('invoices')
        .select(
          `
          *,
          client:clients(*)
        `,
        )
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentError) throw recentError;

      // Calculate stats
      const totalRevenue =
        invoiceData?.reduce((sum, invoice) => {
          return invoice.status === 'paid' ? sum + (invoice.total_gross || 0) : sum;
        }, 0) || 0;

      const totalInvoices = invoiceData?.length || 0;
      const totalClients = clientsCount || 0;

      const overduePayments =
        invoiceData?.filter((invoice) => {
          if (invoice.status !== 'sent') return false;
          const dueDate = invoice.due_date ? new Date(invoice.due_date) : null;
          return dueDate && dueDate < new Date();
        }).length || 0;

      // Calculate monthly revenue for the last 6 months
      const monthlyRevenue = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const monthlyTotal =
          invoiceData?.reduce((sum, invoice) => {
            if (invoice.status !== 'paid') return sum;
            const invoiceDate = new Date(invoice.created_at);
            if (invoiceDate >= monthStart && invoiceDate <= monthEnd) {
              return sum + (invoice.total_gross || 0);
            }
            return sum;
          }, 0) || 0;

        monthlyRevenue.push({
          month: date.toLocaleDateString('pl-PL', { month: 'short', year: '2-digit' }),
          revenue: monthlyTotal,
        });
      }

      setStats({
        totalRevenue,
        totalInvoices,
        totalClients,
        overduePayments,
        monthlyRevenue,
        recentInvoices: (recentInvoicesData || []) as Array<Invoice & { client: Client }>,
      });

      logger.info('Dashboard stats fetched successfully', {
        totalRevenue,
        totalInvoices,
        totalClients,
        overduePayments,
      });
    } catch (error) {
      logger.error('Failed to fetch dashboard stats', error, { userId: user.id });
      setError('Nie udało się pobrać danych dashboard');
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
    }
  }, [user, fetchDashboardStats]);

  if (authLoading || loading) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <div className='text-lg text-gray-600'>Ładowanie danych...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='rounded-lg border border-red-200 bg-red-50 p-4'>
        <div className='text-red-800'>{error}</div>
        <button onClick={fetchDashboardStats} className='mt-2 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700'>
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(amount);
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Dashboard</h1>
          <p className='text-gray-600'>Przegląd Twojej działalności</p>
        </div>
        <div className='text-sm text-gray-500'>Ostatnia aktualizacja: {new Date().toLocaleString('pl-PL')}</div>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
        <StatCard
          title='Łączny przychód'
          value={formatCurrency(stats.totalRevenue)}
          icon={BsCashStack}
          trend='12%'
          color='green'
        />
        <StatCard title='Liczba faktur' value={stats.totalInvoices} icon={BsFileEarmarkText} trend='8%' color='blue' />
        <StatCard title='Liczba klientów' value={stats.totalClients} icon={BsPeople} trend='15%' color='blue' />
        <StatCard title='Zaległe płatności' value={stats.overduePayments} icon={BsCreditCard} color='red' />
      </div>

      {/* Charts Section */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        {/* Monthly Revenue Chart */}
        <div className='rounded-lg border bg-white p-6 shadow-sm'>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-gray-900'>Przychody miesięczne</h2>
            <BsBarChart className='h-5 w-5 text-gray-500' />
          </div>
          <div className='space-y-3'>
            {stats.monthlyRevenue.map((month, index) => (
              <div key={index} className='flex items-center justify-between'>
                <span className='text-sm text-gray-600'>{month.month}</span>
                <div className='flex items-center space-x-2'>
                  <div
                    className='h-2 rounded bg-blue-500'
                    style={{
                      width: `${Math.max(
                        (month.revenue / Math.max(...stats.monthlyRevenue.map((m) => m.revenue))) * 100,
                        2,
                      )}%`,
                      minWidth: '20px',
                    }}
                  />
                  <span className='text-sm font-medium text-gray-900'>{formatCurrency(month.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className='rounded-lg border bg-white p-6 shadow-sm'>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-gray-900'>Ostatnie faktury</h2>
            <BsCalendarEvent className='h-5 w-5 text-gray-500' />
          </div>
          <div className='space-y-3'>
            {stats.recentInvoices.length === 0 ? (
              <p className='text-gray-500'>Brak faktur do wyświetlenia</p>
            ) : (
              stats.recentInvoices.map((invoice) => (
                <div key={invoice.id} className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-gray-900'>{invoice.number}</p>
                    <p className='text-xs text-gray-500'>{invoice.client?.name || 'Nieznany klient'}</p>
                  </div>
                  <div className='text-right'>
                    <p className='text-sm font-medium text-gray-900'>{formatCurrency(invoice.total_gross || 0)}</p>
                    <p
                      className={cn('text-xs', {
                        'text-green-600': invoice.status === 'paid',
                        'text-blue-600': invoice.status === 'sent',
                        'text-gray-600': invoice.status === 'draft',
                        'text-red-600': invoice.status === 'overdue',
                      })}>
                      {invoice.status === 'paid' && 'Opłacone'}
                      {invoice.status === 'sent' && 'Wysłane'}
                      {invoice.status === 'draft' && 'Szkic'}
                      {invoice.status === 'overdue' && 'Przeterminowane'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          {stats.recentInvoices.length > 0 && (
            <div className='mt-4'>
              <button
                onClick={() => typeof window !== 'undefined' && router.push('/invoices')}
                className='text-sm text-blue-600 hover:text-blue-800'>
                Zobacz wszystkie faktury →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className='rounded-lg border bg-white p-6 shadow-sm'>
        <h2 className='mb-4 text-lg font-semibold text-gray-900'>Szybkie akcje</h2>
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
          <button
            onClick={() => typeof window !== 'undefined' && router.push('/invoices/new')}
            className='rounded-lg border border-blue-200 bg-blue-50 p-4 text-left hover:bg-blue-100'>
            <BsFileEarmarkText className='mb-2 h-5 w-5 text-blue-600' />
            <p className='text-sm font-medium text-blue-900'>Nowa faktura</p>
            <p className='text-xs text-blue-700'>Utwórz nową fakturę</p>
          </button>
          <button
            onClick={() => typeof window !== 'undefined' && router.push('/clients/new')}
            className='rounded-lg border border-green-200 bg-green-50 p-4 text-left hover:bg-green-100'>
            <BsPeople className='mb-2 h-5 w-5 text-green-600' />
            <p className='text-sm font-medium text-green-900'>Nowy klient</p>
            <p className='text-xs text-green-700'>Dodaj nowego klienta</p>
          </button>
          <button
            onClick={() => typeof window !== 'undefined' && router.push('/products/new')}
            className='rounded-lg border border-orange-200 bg-orange-50 p-4 text-left hover:bg-orange-100'>
            <BsCashStack className='mb-2 h-5 w-5 text-orange-600' />
            <p className='text-sm font-medium text-orange-900'>Nowy produkt</p>
            <p className='text-xs text-orange-700'>Dodaj produkt/usługę</p>
          </button>
        </div>
      </div>
    </div>
  );
}
