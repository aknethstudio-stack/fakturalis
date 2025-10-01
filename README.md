# 🧾 InvoiceForge

> **Nowoczesny system fakturowania dla polskich przedsiębiorców**  
> Twórz faktury zgodne z KSeF, zarządzaj klientami i produktami w jednym miejscu.

[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.1-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1.13-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-2.58.0-3ECF8E?logo=supabase)](https://supabase.io/)

## ✨ Funkcjonalności

### 🏢 Zarządzanie Klientami

- **Kompleksowe dane kontaktowe** - nazwa, adres, NIP, e-mail, telefon
- **Walidacja NIP** - automatyczna weryfikacja polskich numerów podatkowych
- **Historia współpracy** - przegląd wszystkich faktur dla klienta

### 📋 Katalog Produktów/Usług

- **Szybkie szablony** - predefiniowane produkty i usługi
- **Elastyczne ceny** - różne stawki VAT, rabaty, jednostki miary
- **Kategoryzacja** - organizacja produktów w logiczne grupy

### 🧾 Profesjonalne Faktury

- **Zgodność z KSeF** - pełna integracja z Krajowym System e-Faktur
- **Automatyczne obliczenia** - VAT, netto, brutto, należność
- **Eksport PDF** - profesjonalne szablony faktur do druku
- **Numeracja automatyczna** - kolejne numery zgodne z przepisami

### 🔐 Bezpieczeństwo

- **Multi-tenant SaaS** - każdy użytkownik ma dostęp tylko do swoich danych
- **Row Level Security** - zabezpieczenia na poziomie bazy danych
- **Uwierzytelnianie** - bezpieczny system logowania z Supabase Auth

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

```bash
# Tryb produkcyjny (zalecany dla słabszego sprzętu)
npm run build && npm run start

# Tradycyjny tryb development
npm run dev

# Wszystkie sprawdzenia jakości kodu
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

```
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

- 📋 [**AGENTS.md**](./AGENTS.md) - Przewodnik dla AI asystentów
- 🔧 [**Cross-Platform Setup**](./local-notes/cross-platform-setup.md) - Instalacja na różnych
  systemach
- 🔐 [**Auth System**](./docs/auth-system.md) - System uwierzytelniania
- 🛡️ [**hCaptcha Setup**](./docs/hcaptcha-setup.md) - Konfiguracja zabezpieczeń

## 🤝 Współpraca

### Przed Contribucją

1. Fork repozytorium
2. Utwórz branch: `feature/INV-123-opis`
3. Sprawdź jakość: `npm run check`
4. Commit z Conventional Commits
5. Utwórz Pull Request

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
📧 akneth.studio@gmail.com

---

## 🌟 Wsparcie Projektu

Jeśli InvoiceForge pomaga Ci w prowadzeniu biznesu, rozważ wsparcie rozwoju:

- ⭐ **Star** - oznacz projekt gwiazdką na GitHub
- 🐛 **Issues** - zgłaszaj błędy i sugestie
- 💡 **Ideas** - proponuj nowe funkcjonalności
- 📢 **Share** - podziel się z innymi przedsiębiorcami

**Zbudujmy razem najlepszy polski system fakturowania! 🇵🇱**
