# 🧾 InvoiceForge

> **Nowoczesny system fakturowania SaaS dla polskich przedsiębiorców**  
> Twórz faktury zgodne z KSeF, zarządzaj klientami i produktami w jednym miejscu.

## 🇵🇱 Polska Specyfikacja & Compliance

### Legal Compliance

- ✅ **Stawka VAT 23%** - standardowa stawka podatkowa + inne stawki
- ✅ **Walidacja NIP** - weryfikacja numerów podatkowych z algorytmem kontrolnym
- ✅ **Format adresów** - polskie kody pocztowe (XX-XXX) + walidacja
- ✅ **Język interfejsu** - w pełni spolszczony UI i komunikaty
- ✅ **Waluta PLN** - polski złoty jako domyślna + multi-currency
- ✅ **JPK Integration** - pliki JPK_V7, JPK_FA, JPK_EWP, JPK_MAG (Smart+)

### Konkurencyjne Pozycjonowanie

| Feature           | InvoiceForge | iFirma    | Fakturownia | inFakt  |
| ----------------- | ------------ | --------- | ----------- | ------- |
| **Free Plan**     | 7 faktur     | ❌        | 3 faktury   | ❌      |
| **Modern UI**     | React 19     | Legacy    | Legacy      | Legacy  |
| **API Access**    | Business+    | Premium   | Premium     | Premium |
| **Mobile PWA**    | ✅           | Częściowo | Częściowo   | ❌      |
| **Price (Smart)** | 49 PLN       | 54 PLN    | 43 PLN      | 19 PLN  |

### Integracje & API

- 🔄 **KSeF** - Krajowy System e-Faktur (Q1 2026)
- 📊 **Księgowość** - eksport do systemów księgowych (Q2 2026)
- 🏦 **Banking APIs** - integracja z polskimi bankami (Business+)
- 🛒 **E-commerce** - WooCommerce, Shopify, Allegro (Enterprise)
- 📱 **Mobile App** - iOS/Android (planowane Q3 2026)

### Freemium Model

Free • Smart (49 PLN) • Business (99 PLN) • Enterprise (299 PLN)

[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.1-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1.13-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-2.58.0-3ECF8E?logo=supabase)](https://supabase.io/)

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/6386ac73fb494afa81495a0ecbf6f0fb)](https://app.codacy.com/gh/aknethstudio-stack/invoiceforge/dashboard)
[![Codacy Badge](https://app.codacy.com/project/badge/Coverage/6386ac73fb494afa81495a0ecbf6f0fb)](https://app.codacy.com/gh/aknethstudio-stack/invoiceforge/dashboard)

## ✨ Funkcjonalności

### 💰 Modele Subskrypcji

- **Free Plan (0 PLN)** - Do 7 faktur miesięcznie, podstawowe funkcje
- **Smart Plan (49 PLN)** - Nielimitowane faktury, 3 użytkowników, JPK
- **Business Plan (99 PLN)** - 10 użytkowników, magazyny, OCR, API
- **Enterprise Plan (299 PLN)** - Unlimited users, white-label, SLA 99.9%

### 🏢 Zarządzanie Klientami

- **Kompleksowe dane kontaktowe** - nazwa, adres, NIP, e-mail, telefon
- **Walidacja NIP** - automatyczna weryfikacja polskich numerów podatkowych
- **Historia współpracy** - przegląd wszystkich faktur dla klienta
- **Wyszukiwanie fuzzy** - inteligentne wyszukiwanie klientów

### 📋 Katalog Produktów/Usług

- **Szybkie szablony** - predefiniowane produkty i usługi
- **Elastyczne ceny** - różne stawki VAT, rabaty, jednostki miary
- **Kategoryzacja** - organizacja produktów w logiczne grupy
- **Kody EAN** - wsparcie dla kodów kreskowych (Smart+)

### 🧾 Profesjonalne Faktury

- **Zgodność z KSeF** - pełna integracja z Krajowym System e-Faktur
- **Automatyczne obliczenia** - VAT, netto, brutto, należność
- **Eksport PDF** - profesjonalne szablony faktur do druku
- **Numeracja automatyczna** - kolejne numery zgodne z przepisami
- **Faktury cykliczne** - automatyczne wystawianie faktur (Smart+)

### 🔐 Enterprise Security

- **Multi-tenant SaaS** - każdy użytkownik ma dostęp tylko do swoich danych
- **Row Level Security** - zabezpieczenia na poziomie bazy danych
- **Uwierzytelnianie** - bezpieczny system logowania z Supabase Auth
- **SLA 99.9%** - gwarancja dostępności dla Enterprise
- **SOC 2 Compliance** - certyfikaty bezpieczeństwa dla dużych firm

## 🚀 Szybki Start

### Wymagania

- **Node.js** 22.x (zalecane via nvm/nvm-windows)
- **npm** >=10.x
- **Git** najnowsza wersja

### Instalacja

```bash
# Klonowanie repozytorium
git clone https://github.com/aknethstudio-stack/invoiceforge.git
cd invoiceforge

# Instalacja zależności i konfiguracja
npm run setup

# Konfiguracja środowiska
cp .env.example .env.local
# Edytuj .env.local z własnymi wartościami
```

### Rozwój Aplikacji

⚠️ **WAŻNE**: Projekt zoptymalizowany pod słabszy sprzęt (4GB RAM). Zalecamy production-mode
development:

```bash
# 🏆 Zalecany workflow (production-mode development)
npm run build && npm run start

# 🐌 Tradycyjny tryb development (tylko dla mocnego sprzętu >8GB RAM)
npm run dev

# ⚡ Eksperymentalny Turbopack (Next.js 15)
npm run dev:turbo

# ✅ Wszystkie sprawdzenia jakości kodu przed commit
npm run check
```

## 🏗️ Architektura

### Tech Stack

- **Frontend**: Next.js 15.5.4 + React 19.1.1 + TypeScript 5.9.2
- **Styling**: Tailwind CSS v4.1.13 + SCSS
- **Backend**: Supabase PostgreSQL + Auth + Storage
- **Validation**: Zod 4.1.11 + React Hook Form 7.63.0
- **UI Components**: Headless UI 2.2.9 + React Icons 5.5.0
- **PDF Generation**: jsPDF 3.0.3 + jsPDF-AutoTable 5.0.2

### Bezpieczeństwo

- **Row Level Security (RLS)** - izolacja danych między użytkownikami
- **Multi-tenant** - każda tabela ma pole `owner_id`
- **Type Safety** - pełne typowanie bazy danych w TypeScript

## 📁 Struktura Projektu

```text
invoiceforge/
├── src/
│   ├── app/              # Next.js App Router - strony i API
│   ├── components/       # Komponenty React (forms/, layout/, ui/)
│   ├── hooks/           # Custom hooks (Supabase integration)
│   ├── lib/             # Utilities, validations, database client
│   ├── styles/          # Globalne style CSS/SCSS
│   └── types/           # Definicje TypeScript
├── public/              # Statyczne pliki (ikony, obrazy)
├── __tests__/           # Testy jednostkowe i integracyjne
├── .vscode/             # Konfiguracja VS Code
└── local-notes/         # Dokumentacja rozwoju
```

## 🧪 Testowanie

```bash
# Uruchomienie testów
npm test

# Testy w trybie watch
npm run test:watch

# Testy z coverage
npm run test:coverage

# Wszystkie sprawdzenia (CI)
npm run test:ci
```

## 📋 Komendy Deweloperskie

### Jakość Kodu

```bash
npm run lint         # ESLint
npm run format       # Prettier
npm run stylelint    # Style linting
npm run type-check   # TypeScript
npm run check        # Wszystkie sprawdzenia
```

### Budowanie

```bash
npm run build        # Build produkcyjny
npm run analyze      # Analiza rozmiaru bundle
npm run clean        # Czyszczenie cache
```

### Release

```bash
npm run release      # Nowa wersja z changelog
npm run release:patch # Patch version
npm run release:minor # Minor version
```

## 🇵🇱 Polska Specyfikacja

### Zgodność Prawna

- ✅ **Stawka VAT 23%** - standardowa stawka podatkowa
- ✅ **Walidacja NIP** - weryfikacja numerów podatkowych
- ✅ **Format adresów** - polskie kody pocztowe (XX-XXX)
- ✅ **Język interfejsu** - w pełni spolszczony
- ✅ **Waluta PLN** - polski złoty jako domyślna

### Integracje

- 🔄 **KSeF** - Krajowy System e-Faktur (planowane)
- 📊 **Księgowość** - eksport do systemów księgowych (planowane)

## 🔧 Środowisko Deweloperskie

### Wspierane Edytory

- **VS Code** - pełna konfiguracja w `.vscode/`
- **Zed Editor** - konfiguracja w `.zed/`
- **Inne** - wspierane przez `.editorconfig`

### Git Workflow

- **Husky** - pre-commit hooks
- **Conventional Commits** - standaryzowane commity
- **Git Flow** - `main` (production) + `develop` (integration)

### Optymalizacje

- **Produkcyjny workflow** - dla słabszego sprzętu (4GB RAM)
- **Turbopack** - eksperymentalne przyspieszenie
- **Bundle analysis** - monitoring rozmiaru aplikacji

## 📖 Dokumentacja

### Business & Strategy

- 📋 [**AGENTS.md**](./AGENTS.md) - Przewodnik dla AI asystentów
- 💰 [**Pricing Strategy**](./docs/pricing-strategy.md) - Model biznesowy i konkurencja
- � [**Subscription Management**](./docs/subscription-management.md) - Zarządzanie subskrypcjami
- 📈 [**Strategic Plan**](./local-notes/PLAN.md) - Kompletny plan biznesowy

### Rozwój i Konfiguracja

- �🔐 [**Auth System**](./docs/auth-system.md) - System uwierzytelniania i bezpieczeństwa
- 🛡️ [**hCaptcha Setup**](./docs/hcaptcha-setup.md) - Konfiguracja zabezpieczeń anti-bot
- 📊 [**Codacy Integration**](./docs/codacy-integration.md) - Analiza jakości kodu
- 🔒 [**Branch Protection**](./docs/github-branch-protection.md) - Bezpieczeństwo repozytorium

### Techniczne

- 🗄️ [**Database Schema**](./docs/database-schema.md) - Struktura bazy danych z RLS
- 🧪 [**Testing Guide**](./docs/testing.md) - Testowanie z subscription mocks
- 🌿 [**Git Workflow**](./docs/git-workflow.md) - Git Flow i konwencje
- 🔒 [**Security Guide**](./docs/security.md) - Bezpieczeństwo aplikacji SaaS

## 🤝 Współpraca

### Przed kontrybucją

1. Fork repozytorium
2. Utwórz branch: `feature/opis` (nazwa nie wymaga numeru ticketu)
3. Sprawdź jakość: `npm run check`
4. Commit zgodny z Conventional Commits
5. Utwórz Pull Request

**Branch naming** nie wymaga numerów ticketów ani formalnych zgłoszeń. Zgłaszanie issue na GitHub jest możliwe i mile widziane – możesz raportować błędy, pomysły i zadania według własnych potrzeb.

### Standards

- **TypeScript Strict Mode** - pełne typowanie
- **No Inline Comments** - kod ma być samodokumentujący
- **Polish UI** - interfejs w języku polskim
- **RLS Patterns** - zawsze używaj `owner_id`

## 📄 Licencja

**AGPL-3.0-only** - [Szczegóły](./LICENSE)

## 👨‍💻 Autor

**AKNETH Studio - Katarzyna Pawłowska-Malesa**  
🌐 [Portfolio](https://akneth-studio.vercel.app)  
📧 <akneth.studio@gmail.com>

---

## 🌟 Wsparcie Projektu

Jeśli InvoiceForge pomaga Ci w prowadzeniu biznesu, rozważ wsparcie rozwoju:

- ⭐ **Star** - oznacz projekt gwiazdką na GitHub
- 🐛 **Issues** - zgłaszaj błędy i sugestie
- 💡 **Ideas** - proponuj nowe funkcjonalności
- 📢 **Share** - podziel się z innymi przedsiębiorcami

## 🇵🇱 Misja

Zbudujmy razem najlepszy polski system fakturowania!
