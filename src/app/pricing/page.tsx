import { pricingFAQ, pricingPlans } from '@/lib/pricing-plans';
import { FaCheck } from 'react-icons/fa';

export default function PricingPage() {
  return (
    <div className='bg-gradient-to-br from-blue-50 to-white py-16'>
      <div className='container mx-auto px-4'>
        {/* Header */}
        <div className='mb-16 text-center'>
          <h1 className='mb-4 text-4xl font-bold text-gray-900 lg:text-5xl'>Prosty i przejrzysty cennik</h1>
          <p className='mx-auto max-w-2xl text-lg text-gray-600'>
            Wybierz plan dopasowany do potrzeb Twojej firmy. Wszystkie plany obejmują pełne wsparcie techniczne i
            regularne aktualizacje.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className='grid gap-8 lg:grid-cols-3'>
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 shadow-lg ${
                plan.popular
                  ? 'ring-opacity-50 border-2 border-blue-500 bg-white ring-2 ring-blue-500'
                  : 'border border-gray-200 bg-white'
              }`}>
              {plan.popular && (
                <div className='absolute -top-4 left-1/2 -translate-x-1/2 transform'>
                  <span className='rounded-full bg-blue-500 px-4 py-2 text-sm font-medium text-white'>
                    Najpopularniejszy
                  </span>
                </div>
              )}

              <div className='mb-8'>
                <h3 className='mb-2 text-2xl font-bold text-gray-900'>{plan.name}</h3>
                <p className='mb-4 text-gray-600'>{plan.description}</p>
                <div className='flex items-baseline'>
                  <span className='text-4xl font-bold text-gray-900'>{plan.price}</span>
                  <span className='ml-1 text-xl text-gray-600'>zł</span>
                  <span className='ml-2 text-gray-500'>{plan.period}</span>
                </div>
              </div>

              <ul className='mb-8 space-y-3'>
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className='flex items-start'>
                    <FaCheck className='mr-3 h-5 w-5 flex-shrink-0 text-green-500' />
                    <span className='text-gray-600'>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full rounded-lg px-6 py-3 font-medium transition-colors ${
                  plan.popular
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className='mt-16 text-center'>
          <h2 className='mb-8 text-3xl font-bold text-gray-900'>Często zadawane pytania</h2>
          <div className='mx-auto max-w-3xl space-y-6'>
            {pricingFAQ.map((faq, index) => (
              <div key={index} className='rounded-lg bg-white p-6 shadow'>
                <h3 className='mb-2 font-semibold text-gray-900'>{faq.question}</h3>
                <p className='text-gray-600'>{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className='mt-16 rounded-2xl bg-blue-600 p-8 text-center text-white lg:p-12'>
          <h2 className='mb-4 text-3xl font-bold'>Gotowy, aby rozpocząć?</h2>
          <p className='mb-8 text-xl'>Dołącz do tysięcy przedsiębiorców, którzy już korzystają z InvoiceForge</p>
          <button className='rounded-lg bg-white px-8 py-3 font-medium text-blue-600 transition-colors hover:bg-gray-100'>
            Rozpocznij 14-dniowy okres próbny
          </button>
        </div>
      </div>
    </div>
  );
}
