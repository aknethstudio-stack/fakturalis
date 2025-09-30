import Link from 'next/link';
import {
  BsArrowRight as ArrowRight,
  BsBarChart as BarChart3,
  BsFileText as FileText,
  BsBox as Package,
  BsPeople as Users,
} from 'react-icons/bs';

export default function Page() {
  return (
    <div className='bg-gray-50'>
      {/* Hero Section */}
      <section className='py-20'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <h1 className='text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl'>
              Fakturowanie dla
              <span className='text-brand'> profesjonalistów</span>
            </h1>
            <p className='mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600'>
              Twórz faktury, zarządzaj klientami i śledź płatności w jednym miejscu. Zgodne z polskim prawem, szybkie i
              intuicyjne.
            </p>
            <div className='mt-10 flex items-center justify-center gap-x-6'>
              <Link
                href='/auth/signup'
                className='bg-brand hover:bg-brand-600 focus-visible:outline-brand rounded-md px-6 py-3 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'>
                Rozpocznij za darmo
              </Link>
              <Link href='/demo' className='text-sm leading-6 font-semibold text-gray-900'>
                Zobacz demo <span aria-hidden='true'>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className='py-24'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='mx-auto max-w-2xl text-center'>
            <h2 className='text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl'>Wszystko czego potrzebujesz</h2>
            <p className='mt-4 text-lg text-gray-600'>
              Kompleksowe rozwiązanie do zarządzania fakturowaniem w Twojej firmie
            </p>
          </div>

          <div className='mx-auto mt-16 max-w-5xl'>
            <div className='grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4'>
              {/* Faktury */}
              <div className='rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-200'>
                <div className='bg-brand/10 w-fit rounded-lg p-3'>
                  <FileText className='text-brand h-6 w-6' />
                </div>
                <h3 className='mt-4 text-lg font-semibold text-gray-900'>Faktury</h3>
                <p className='mt-2 text-sm text-gray-600'>
                  Twórz profesjonalne faktury zgodne z polskim prawem w kilku kliknięciach
                </p>
                <Link
                  href='/invoices'
                  className='text-brand hover:text-brand-600 mt-4 inline-flex items-center text-sm font-medium'>
                  Więcej <ArrowRight className='ml-1 h-4 w-4' />
                </Link>
              </div>

              {/* Klienci */}
              <div className='rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-200'>
                <div className='w-fit rounded-lg bg-green-100 p-3'>
                  <Users className='h-6 w-6 text-green-600' />
                </div>
                <h3 className='mt-4 text-lg font-semibold text-gray-900'>Klienci</h3>
                <p className='mt-2 text-sm text-gray-600'>
                  Zarządzaj bazą klientów, śledź historię współpracy i płatności
                </p>
                <Link
                  href='/clients'
                  className='mt-4 inline-flex items-center text-sm font-medium text-green-600 hover:text-green-700'>
                  Więcej <ArrowRight className='ml-1 h-4 w-4' />
                </Link>
              </div>

              {/* Produkty */}
              <div className='rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-200'>
                <div className='w-fit rounded-lg bg-purple-100 p-3'>
                  <Package className='h-6 w-6 text-purple-600' />
                </div>
                <h3 className='mt-4 text-lg font-semibold text-gray-900'>Produkty</h3>
                <p className='mt-2 text-sm text-gray-600'>Katalog produktów i usług z cenami, VAT i opisami</p>
                <Link
                  href='/products'
                  className='mt-4 inline-flex items-center text-sm font-medium text-purple-600 hover:text-purple-700'>
                  Więcej <ArrowRight className='ml-1 h-4 w-4' />
                </Link>
              </div>

              {/* Raporty */}
              <div className='rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-200'>
                <div className='w-fit rounded-lg bg-orange-100 p-3'>
                  <BarChart3 className='h-6 w-6 text-orange-600' />
                </div>
                <h3 className='mt-4 text-lg font-semibold text-gray-900'>Raporty</h3>
                <p className='mt-2 text-sm text-gray-600'>Analizy sprzedaży, przychody i zestawienia do księgowości</p>
                <Link
                  href='/reports'
                  className='mt-4 inline-flex items-center text-sm font-medium text-orange-600 hover:text-orange-700'>
                  Więcej <ArrowRight className='ml-1 h-4 w-4' />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
