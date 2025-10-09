import emailjs from '@emailjs/browser';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import * as XLSX from 'xlsx';

import { useAuth, useSupabase } from '@/hooks/use-supabase';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/database';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import {
  BsBarChart,
  BsCalendarEvent,
  BsCashStack,
  BsCreditCard,
  BsFileEarmarkText,
  BsGraphUp,
  BsPeople,
  BsPieChart,
  BsStar,
} from 'react-icons/bs';

type Invoice = Database['public']['Tables']['invoices']['Row'];
type Client = Database['public']['Tables']['clients']['Row'];

interface DashboardStats {
  totalRevenue: number;
  totalInvoices: number;
  totalClients: number;
  overduePayments: number;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  recentInvoices: Array<Invoice & { client: Client }>;
  mrr: number;
  churn: number;
  clv: number;
  cashflow: Array<{ month: string; value: number }>;
  clientSegments: Array<{ segment: string; count: number }>;
  topProducts: Array<{ name: string; revenue: number }>;
  periodComparisons: Array<{ period: string; value: number; prevValue: number }>;
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
    mrr: 0,
    churn: 0,
    clv: 0,
    cashflow: [],
    clientSegments: [],
    topProducts: [],
    periodComparisons: [],
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

      // --- MOCK: Zaawansowane wskaźniki (do wdrożenia z prawdziwymi danymi) ---
      // MRR: suma faktur cyklicznych z ostatniego miesiąca
      const mrr = invoiceData?.filter((i) => i.status === 'paid').reduce((sum, i) => sum + (i.total_gross || 0), 0) / 6;
      // Churn: % klientów, którzy nie wystawili faktury w ostatnich 3 miesiącach
      const churn = 5.2; // docelowo: oblicz na podstawie klientów i faktur
      // CLV: średnia wartość klienta
      const clv = totalClients ? totalRevenue / totalClients : 0;
      // Cashflow: uproszczony, na podstawie przychodów miesięcznych
      const cashflow = monthlyRevenue.map((m) => ({ month: m.month, value: m.revenue }));
      // Segmentacja klientów: mock
      const clientSegments = [
        { segment: 'Mikrofirmy', count: Math.floor(totalClients * 0.5) },
        { segment: 'SME', count: Math.floor(totalClients * 0.3) },
        { segment: 'Enterprise', count: Math.floor(totalClients * 0.2) },
      ];
      // Top produkty: mock
      const topProducts = [
        { name: 'Usługa A', revenue: 12000 },
        { name: 'Produkt B', revenue: 8000 },
        { name: 'Konsultacja C', revenue: 5000 },
      ];
      // Porównania okresowe: mock
      const periodComparisons = [
        { period: 'Miesiąc', value: totalRevenue, prevValue: totalRevenue * 0.88 },
        { period: 'Rok', value: totalRevenue * 12, prevValue: totalRevenue * 10 },
      ];

      setStats({
        totalRevenue,
        totalInvoices,
        totalClients,
        overduePayments,
        monthlyRevenue,
        recentInvoices: (recentInvoicesData || []) as Array<Invoice & { client: Client }>,
        mrr,
        churn,
        clv,
        cashflow,
        clientSegments,
        topProducts,
        periodComparisons,
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

  // Eksport danych do CSV
  const handleExportCSV = () => {
    const rows = [
      ['Wskaźnik', 'Wartość'],
      ['Łączny przychód', stats.totalRevenue],
      ['MRR', stats.mrr],
      ['Churn (%)', stats.churn],
      ['CLV', stats.clv],
      ['Liczba faktur', stats.totalInvoices],
      ['Liczba klientów', stats.totalClients],
      ['Zaległe płatności', stats.overduePayments],
    ];
    // Dodaj miesięczne przychody
    rows.push(['', '']);
    rows.push(['Przychody miesięczne', '']);
    stats.monthlyRevenue.forEach((m) => {
      rows.push([m.month, m.revenue]);
    });
    // Dodaj cashflow
    rows.push(['', '']);
    rows.push(['Cashflow miesięczny', '']);
    stats.cashflow.forEach((c) => {
      rows.push([c.month, c.value]);
    });
    // Dodaj segmentację klientów
    rows.push(['', '']);
    rows.push(['Segmentacja klientów', '']);
    stats.clientSegments.forEach((s) => {
      rows.push([s.segment, s.count]);
    });
    // Dodaj top produkty
    rows.push(['', '']);
    rows.push(['Top produkty/usługi', '']);
    stats.topProducts.forEach((p) => {
      rows.push([p.name, p.revenue]);
    });
    // Dodaj porównania okresowe
    rows.push(['', '']);
    rows.push(['Porównania okresowe', '']);
    stats.periodComparisons.forEach((cmp) => {
      rows.push([cmp.period, cmp.value]);
    });
    // Konwersja do CSV
    const csvContent = rows.map((r) => r.join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-eksport-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Eksport danych do Excela (XLSX)
  const handleExportExcel = () => {
    const wsData = [
      ['Wskaźnik', 'Wartość'],
      ['Łączny przychód', stats.totalRevenue],
      ['MRR', stats.mrr],
      ['Churn (%)', stats.churn],
      ['CLV', stats.clv],
      ['Liczba faktur', stats.totalInvoices],
      ['Liczba klientów', stats.totalClients],
      ['Zaległe płatności', stats.overduePayments],
      [],
      ['Przychody miesięczne', ''],
      ...stats.monthlyRevenue.map((m) => [m.month, m.revenue]),
      [],
      ['Cashflow miesięczny', ''],
      ...stats.cashflow.map((c) => [c.month, c.value]),
      [],
      ['Segmentacja klientów', ''],
      ...stats.clientSegments.map((s) => [s.segment, s.count]),
      [],
      ['Top produkty/usługi', ''],
      ...stats.topProducts.map((p) => [p.name, p.revenue]),
      [],
      ['Porównania okresowe', ''],
      ...stats.periodComparisons.map((cmp) => [cmp.period, cmp.value]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dashboard');
    XLSX.writeFile(wb, `dashboard-eksport-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Funkcja wysyłania e-maila z raportem
  const handleSendEmail = async () => {
    try {
      await emailjs.send(
        'service_fakturalis',
        'template_dashboard_report',
        {
          mrr: stats.mrr,
          churn: stats.churn,
          clv: stats.clv,
          cashflow: JSON.stringify(stats.cashflow),
          // Dodaj inne metryki
        },
        'user_xxxxxxxx', // Wstaw swój publiczny klucz EmailJS
      );
      alert('Raport został wysłany na e-mail!');
    } catch (error) {
      alert('Błąd wysyłania e-maila: ' + error);
    }
  };
  // Funkcja podglądu mobilnego
  const handleMobilePreview = () => {
    window.open('/dashboard?mobile=1', '_blank', 'width=375,height=812');
  };
  // Funkcja onboarding
  const handleOnboarding = () => {
    window.location.href = '/onboarding';
  };
  // Funkcja eksportu PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text('Raport analityczny Fakturalis', 14, 16);
    autoTable(doc, {
      head: [['Metryka', 'Wartość']],
      body: [
        ['MRR', stats.mrr],
        ['Churn', stats.churn],
        ['CLV', stats.clv],
        ['Cashflow', stats.cashflow.map((c) => `${c.month}: ${c.value}`).join(', ')],
        // Dodaj inne metryki według potrzeb
      ],
      startY: 24,
    });
    doc.save('dashboard-raport.pdf');
  };
  // Funkcja integracji
  const handleIntegrations = () => {
    window.location.href = '/settings/integrations';
  };

  return (
    <div className='space-y-6'>
      {/* Header + Eksport */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Dashboard</h1>
          <p className='text-gray-600'>Przegląd Twojej działalności</p>
        </div>
        <div className='flex items-center gap-4'>
          <div className='text-sm text-gray-500'>Ostatnia aktualizacja: {new Date().toLocaleString('pl-PL')}</div>
          <button
            onClick={handleExportCSV}
            className='rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700'>
            Eksportuj dane (CSV)
          </button>
          <button
            onClick={handleExportExcel}
            className='rounded bg-green-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-green-700'>
            Eksportuj Excel
          </button>
          <button
            onClick={handleExportPDF}
            className='rounded bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-orange-700'>
            Eksportuj PDF
          </button>
          <button
            onClick={handleSendEmail}
            className='rounded bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-purple-700'>
            Wyślij e-mail
          </button>
          <button
            onClick={handleMobilePreview}
            className='rounded bg-pink-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-pink-700'>
            Mobile preview
          </button>
          <button
            onClick={handleOnboarding}
            className='rounded bg-gray-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-gray-700'>
            Onboarding
          </button>
          <button
            onClick={handleIntegrations}
            className='rounded bg-yellow-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-yellow-700'>
            Integracje
          </button>
        </div>
      </div>

      {/* Stats Cards + Advanced KPIs */}
      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
        <StatCard
          title='Łączny przychód'
          value={formatCurrency(stats.totalRevenue)}
          icon={BsCashStack}
          trend='12%'
          color='green'
        />
        <StatCard
          title='MRR (przychód cykliczny)'
          value={formatCurrency(stats.mrr)}
          icon={BsGraphUp}
          trend='6%'
          color='blue'
        />
        <StatCard title='Churn (%)' value={stats.churn.toFixed(1) + '%'} icon={BsPieChart} trend='-1%' color='orange' />
        <StatCard title='CLV (wartość klienta)' value={formatCurrency(stats.clv)} icon={BsStar} color='green' />
      </div>
      <div className='mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
        <StatCard title='Liczba faktur' value={stats.totalInvoices} icon={BsFileEarmarkText} trend='8%' color='blue' />
        <StatCard title='Liczba klientów' value={stats.totalClients} icon={BsPeople} trend='15%' color='blue' />
        <StatCard title='Zaległe płatności' value={stats.overduePayments} icon={BsCreditCard} color='red' />
        <StatCard
          title='Cashflow (mies.)'
          value={formatCurrency(
            Array.isArray(stats.cashflow) &&
              stats.cashflow.length > 0 &&
              typeof stats.cashflow[stats.cashflow.length - 1]?.value === 'number'
              ? (stats.cashflow[stats.cashflow.length - 1]?.value ?? 0)
              : 0,
          )}
          icon={BsBarChart}
          color='orange'
        />
      </div>

      {/* Charts & Analytics Section */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        {/* Monthly Revenue Chart (Line) */}
        <div className='rounded-lg border bg-white p-6 shadow-sm'>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-gray-900'>Przychody miesięczne</h2>
            <BsBarChart className='h-5 w-5 text-gray-500' />
          </div>
          <ResponsiveContainer width='100%' height={220}>
            <LineChart data={stats.monthlyRevenue} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <XAxis dataKey='month' />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Line type='monotone' dataKey='revenue' stroke='#2563eb' strokeWidth={3} dot={{ r: 4 }} name='Przychód' />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Cashflow Chart (Bar) */}
        <div className='rounded-lg border bg-white p-6 shadow-sm'>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-gray-900'>Cashflow miesięczny</h2>
            <BsBarChart className='h-5 w-5 text-orange-500' />
          </div>
          <ResponsiveContainer width='100%' height={220}>
            <BarChart data={stats.cashflow} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <XAxis dataKey='month' />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey='value' fill='#f59e42' name='Cashflow' />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className='mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2'>
        {/* Segmentacja klientów (Pie) */}
        <div className='rounded-lg border bg-white p-6 shadow-sm'>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-gray-900'>Segmentacja klientów</h2>
            <BsPieChart className='h-5 w-5 text-blue-500' />
          </div>
          <ResponsiveContainer width='100%' height={220}>
            <PieChart>
              <Pie
                data={stats.clientSegments}
                dataKey='count'
                nameKey='segment'
                cx='50%'
                cy='50%'
                outerRadius={80}
                label>
                {stats.clientSegments.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={['#2563eb', '#22c55e', '#f59e42'][idx % 3]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top produkty/usługi (Bar) */}
        <div className='rounded-lg border bg-white p-6 shadow-sm'>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-gray-900'>Top produkty/usługi</h2>
            <BsStar className='h-5 w-5 text-yellow-500' />
          </div>
          <ResponsiveContainer width='100%' height={220}>
            <BarChart data={stats.topProducts} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <XAxis dataKey='name' />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey='revenue' fill='#2563eb' name='Przychód' />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className='mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2'>
        {/* Segmentacja klientów */}
        <div className='rounded-lg border bg-white p-6 shadow-sm'>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-gray-900'>Segmentacja klientów</h2>
            <BsPieChart className='h-5 w-5 text-blue-500' />
          </div>
          <div className='space-y-3'>
            {stats.clientSegments.map((seg, idx) => (
              <div key={idx} className='flex items-center justify-between'>
                <span className='text-sm text-gray-600'>{seg.segment}</span>
                <span className='text-sm font-medium text-gray-900'>{seg.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top produkty/usługi */}
        <div className='rounded-lg border bg-white p-6 shadow-sm'>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-gray-900'>Top produkty/usługi</h2>
            <BsStar className='h-5 w-5 text-yellow-500' />
          </div>
          <div className='space-y-3'>
            {stats.topProducts.map((prod, idx) => (
              <div key={idx} className='flex items-center justify-between'>
                <span className='text-sm text-gray-600'>{prod.name}</span>
                <span className='text-sm font-medium text-gray-900'>{formatCurrency(prod.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className='mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2'>
        {/* Porównania okresowe */}
        <div className='rounded-lg border bg-white p-6 shadow-sm'>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-gray-900'>Porównania okresowe</h2>
            <BsGraphUp className='h-5 w-5 text-green-500' />
          </div>
          <div className='space-y-3'>
            {stats.periodComparisons.map((cmp, idx) => (
              <div key={idx} className='flex items-center justify-between'>
                <span className='text-sm text-gray-600'>{cmp.period}</span>
                <span className='text-sm font-medium text-gray-900'>
                  {formatCurrency(cmp.value)}
                  <span className='ml-2 text-xs text-gray-500'>
                    ({cmp.prevValue ? (((cmp.value - cmp.prevValue) / cmp.prevValue) * 100).toFixed(1) : '0'}%)
                  </span>
                </span>
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
