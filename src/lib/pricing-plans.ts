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
    name: 'Free',
    price: '0',
    period: 'na zawsze',
    description: 'Idealne dla małych firm rozpoczynających działalność',
    features: [
      'Do 7 faktur miesięcznie',
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
    price: '49',
    period: '/miesiąc',
    description: 'Dla rozwijających się firm z większymi potrzebami',
    features: [
      'Wszystko z planu Free',
      'Do 3 użytkowników',
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
    price: '99',
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
  {
    name: 'Enterprise',
    price: '299',
    period: '/miesiąc',
    description: 'Rozwiązanie dla dużych firm z najwyższymi wymaganiami',
    features: [
      'Wszystko z planu Business',
      'Unlimited użytkownicy',
      'Unlimited magazyny',
      'OCR (unlimited dokumenty)',
      'White-label branding',
      'Dedykowane wsparcie',
      'SLA 99.9%',
      'Custom integracje',
      'Zaawansowane raportowanie',
      'Backup i disaster recovery',
    ],
    cta: 'Wybierz Enterprise',
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
      'Tak, możesz upgradować lub downgradować swój plan w dowolnym momencie. Zmiany wchodzą w życie natychmiast. Przy downgradzie zachowujesz dostęp do wszystkich funkcji do końca okresu rozliczeniowego.',
  },
  {
    question: 'Czy są jakieś ukryte opłaty lub opłaty za konfigurację?',
    answer:
      'Nie ma żadnych ukrytych opłat. Płacisz tylko za wybrany plan miesięczny. Konfiguracja, wsparcie techniczne i regularne aktualizacje są zawsze bezpłatne.',
  },
  {
    question: 'Co się stanie, jeśli przekroczę limit 7 faktur w planie Free?',
    answer:
      'Po osiągnięciu limitu 7 faktur otrzymasz powiadomienie z opcją upgrade do planu Smart za 49 PLN/miesiąc z nielimitowanymi fakturami. Możesz też poczekać do następnego miesiąca.',
  },
  {
    question: 'Czy dostępne są zniżki roczne?',
    answer:
      'Tak! Płacąc za cały rok z góry otrzymujesz 17% zniżki. Smart roczny: 490 PLN (zamiast 588 PLN), Business roczny: 990 PLN (zamiast 1188 PLN), Enterprise roczny: 2990 PLN (zamiast 3588 PLN).',
  },
  {
    question: 'Co oznacza "nielimitowani użytkownicy" w planie Enterprise?',
    answer:
      'W planie Enterprise możesz dodać dowolną liczbę użytkowników bez dodatkowych opłat. Każdy użytkownik ma własne konto z konfigurowalnymi uprawnieniami i dostępem do wszystkich funkcji systemu.',
  },
  {
    question: 'Czy mogę anulować subskrypcję w dowolnym momencie?',
    answer:
      'Tak, możesz anulować subskrypcję w dowolnym momencie bez kar czy opłat dodatkowych. Po anulowaniu zachowujesz pełny dostęp do końca okresu rozliczeniowego, a następnie automatycznie przechodzisz na plan Free.',
  },
  {
    question: 'Jakie metody płatności są akceptowane?',
    answer:
      'Akceptujemy płatności kartą (Visa, Mastercard), przelewy tradycyjne, BLIK oraz PayU. Dla planów Enterprise dostępne są również faktury z odroczonym terminem płatności (30 dni).',
  },
  {
    question: 'Czy dane z planu Free zostaną zachowane po upgrade?',
    answer:
      'Oczywiście! Wszystkie Twoje dane - klienci, faktury, produkty - zostają zachowane. Po upgrade zyskujesz dostęp do dodatkowych funkcji bez utraty dotychczasowych informacji.',
  },
];
