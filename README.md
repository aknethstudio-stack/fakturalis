# 🧾 Fakturalis

> **Nowoczesny system fakturowania SaaS dla polskich przedsiębiorców**  
> Twórz faktury zgodne z KSeF, zarządzaj klientami i produktami w jednym miejscu.

## 🇵🇱 Polska Specyfikacja & Compliance

### Legal Compliance

- **Stawka VAT 23%** – domyślna stawka podatku VAT, obsługa innych stawek
- **Walidacja NIP** – algorytm kontrolny, automatyczna weryfikacja numerów podatkowych
- **Format adresów** – polskie kody pocztowe (XX-XXX), walidacja adresów
- **Język interfejsu** – pełna polonizacja UI i komunikatów
- **Waluta** – PLN jako domyślna, wsparcie multi-currency
- **Zgodność z KSeF** – pełna integracja z Krajowym Systemem e-Faktur
- **Eksport JPK** – generowanie plików JPK_V7, JPK_FA, JPK_EWP, JPK_MAG (Smart+)

### Konkurencyjne Pozycjonowanie

| Feature       | Fakturalis | iFirma    | Fakturownia | inFakt  |
| ------------- | ---------- | --------- | ----------- | ------- |
| Free Plan     | 7 faktur   | ❌        | 3 faktury   | ❌      |
| Modern UI     | React 19   | Legacy    | Legacy      | Legacy  |
| API Access    | Business+  | Premium   | Premium     | Premium |
| Mobile PWA    | ✅         | Częściowo | Częściowo   | ❌      |
| Price (Smart) | 49 PLN     | 54 PLN    | 43 PLN      | 19 PLN  |

## Szybki start

```bash
git clone https://github.com/aknethstudio-stack/fakturalis.git
cd fakturalis
```

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

## Instalacja zależności i konfiguracja

```bash
npm run setup
```

## Konfiguracja środowiska

```bash
cp .env.example .env.local
```

## Edytuj .env.local z własnymi wartościami

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
- **Backend**: Supabase PostgreSQL + Supabase Auth + Realtime
- **PDF**: jsPDF + jsPDF-AutoTable
- **Testy**: Jest + Testing Library

### Struktura katalogów

│ ├── lib/ # Utilities, validations, database client
│ ├── styles/ # Globalne style CSS/SCSS
│ └── types/ # Definicje TypeScript
├── public/ # Statyczne pliki (ikony, obrazy)
├── **tests**/ # Testy jednostkowe i integracyjne
├── .vscode/ # Konfiguracja VS Code
└── local-notes/ # Dokumentacja rozwoju

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
- 📈 [**Strategic Plan**](./local-notes/PLAN.md) - Kompletny plan biznesowy

### Rozwój i Konfiguracja

- 🔐 [**Auth System**](./docs/auth-system.md) - System uwierzytelniania i bezpieczeństwa
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

Jeśli Fakturalis pomaga Ci w prowadzeniu biznesu, rozważ wsparcie rozwoju:

- ⭐ **Star** - oznacz projekt gwiazdką na GitHub
- 🐛 **Issues** - zgłaszaj błędy i sugestie
- 💡 **Ideas** - proponuj nowe funkcjonalności
- 📢 **Share** - podziel się z innymi przedsiębiorcami

## 🇵🇱 Misja

Zbudujmy razem najlepszy polski system fakturowania!

## 🚀 Roadmap

### Q4 2025: MVP Completion & Soft Launch

✅ Kompletny dashboard analityczny: wszystkie wskaźniki biznesowe, interaktywne wykresy (MRR, churn, CLV, cashflow, segmentacja, top produkty, porównania okresowe), szybkie akcje, pełna prezentacja danych zgodnie z wymaganiami rynku polskiego
✅ Eksport danych: CSV, Excel (XLSX), PDF (jsPDF)
✅ Powiadomienia e-mail (EmailJS)
✅ Pełna responsywność mobilna
✅ Onboarding użytkownika
✅ Integracje: KSeF, Upstash, Sentry, Vercel
✅ Szybkie akcje: eksport, powiadomienia, onboarding, mobile, integracje
✅ Przewaga konkurencyjna nad Fakturownia/iFirma/inFakt potwierdzona
