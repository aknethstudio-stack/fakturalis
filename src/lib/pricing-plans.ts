/**
 * Pricing plans configuration for InvoiceForge
 * Contains plan details, features, and pricing information
 */

export interface PricingPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  popular: boolean;
}

export const pricingPlans: PricingPlan[] = [
  {
    name: 'Darmowy',
    price: '0',
    period: 'na zawsze',
    description: 'Idealne dla małych firm rozpoczynających działalność',
    features: [
      'Do 5 faktur miesięcznie',
      'Nielimitowani klienci i produkty/usługi',
      'Szablony faktur i własne logo',
      '1 użytkownik',
      'Wysyłka faktur mailem',
      'Integracja z KSeF',
      'Import/eksport danych',
      'Pobieranie danych z GUS',
      'Rejestracja przychodów i kosztów',
      'Faktury PDF',
      'Status faktury',
      'Sprawdzanie poprawności NIP',
      'Wysyłanie kopii faktury mailem',
      'Rabaty',
      'Kontrola płatności',
      'Szybki przelew',
      'Dowolna waluta na fakturze',
      'Przeliczanie wg kursów NBP, EBC',
      'Faktury w języku obcym i dwujęzyczne',
    ],
    cta: 'Rozpocznij za darmo',
    popular: false,
  },
  {
    name: 'Smart',
    price: '25',
    period: '/miesiąc',
    description: 'Dla rozwijających się firm z większymi potrzebami',
    features: [
      'Wszystko z planu Darmowego',
      'Do 5 użytkowników',
      '5 obsługiwanych magazynów',
      'Wszelkie dokumenty związane z magazynami',
      'Nielimitowane dokumenty',
      'Wiele działów firmy',
      'JPK V7, FA, EWP, MAG',
      'Automatyczne płatności',
      'Faktury cykliczne',
      'OCR (do 5 dokumentów)',
      'Kody EAN + drukowanie etykiet',
      'Import płatności z banku',
      'Opłacanie kosztów',
      'Integracja z kasą fiskalną',
      'Własny szablon faktury',
      'Personalizacja faktur',
    ],
    cta: 'Wybierz Smart',
    popular: true,
  },
  {
    name: 'Business',
    price: '55',
    period: '/miesiąc',
    description: 'Kompleksowe rozwiązanie dla firm z zaawansowanymi potrzebami',
    features: [
      'Wszystko z planu Smart',
      'Do 10 użytkowników',
      'JPK PKPiR',
      'OCR (do 10 dokumentów)',
      'POS (system sprzedaży)',
      'Nielimitowane magazyny',
      'Połączenie z bankiem',
      'Księgowość online',
    ],
    cta: 'Wybierz Business',
    popular: false,
  },
];

/**
 * FAQ data for pricing page
 */
export interface FAQItem {
  question: string;
  answer: string;
}

export const pricingFAQ: FAQItem[] = [
  {
    question: 'Czy mogę zmienić plan w dowolnym momencie?',
    answer:
      'Tak, możesz upgradować lub downgradować swój plan w dowolnym momencie. Zmiany wchodzą w życie natychmiast.',
  },
  {
    question: 'Czy są jakieś ukryte opłaty lub opłaty za konfigurację?',
    answer:
      'Nie ma żadnych ukrytych opłat. Płacisz tylko za wybrany plan miesięczny. Konfiguracja i wsparcie są zawsze bezpłatne.',
  },
  {
    question: 'Co się stanie, jeśli przekroczę limity mojego planu?',
    answer:
      'Otrzymasz powiadomienie przed przekroczeniem limitów. Możesz wtedy upgradować plan lub poczekać do następnego cyklu rozliczeniowego.',
  },
];
