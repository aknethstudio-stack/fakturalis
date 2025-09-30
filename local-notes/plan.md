# Plan stworzenia systemu fakturowania — notatki lokalne

Ten plik służy jako prywatny szkic/plan rozwoju systemu. Folder `local-notes/` jest ignorowany przez
Git i nie trafi do repozytorium zdalnego.

Źródło (pełny dokument z planem):

- [plan]('/home/aknethstudio/Dokumenty/AKNETH STUDIO/Plan stworzenia systemu fakturowania.md')

Możesz tu wklejać skróty/outline/priorytety z dokumentu źródłowego. Unikaj wrażliwych danych.

---

## 1) Cel i zakres projektu

- [ ] Krótki opis produktu (1–2 zdania)
- [ ] Główne grupy użytkowników
- [ ] Wyróżniki/USP
- [ ] Zakres MVP vs. pełna wersja

Notatki:

- …

---

## 2) Wymagania biznesowe i prawne

- [ ] Obsługa polskich faktur (FV, korekty, proforma)
- [ ] Numeracja i serie dokumentów
- [ ] Waluty i kursy (np. NBP)
- [ ] Stawki VAT, zwolnienia, GTU (jeśli dotyczy)
- [ ] JPK/UBL/FA(1) – zakres, roadmap (jeśli planowane)
- [ ] Polityka retencji i archiwizacji

Notatki:

- …

---

## 3) Moduły funkcjonalne (MVP → późniejsze rozszerzenia)

- [ ] Klienci i kontrahenci (CRM light)
- [ ] Produkty/usługi + cenniki
- [ ] Wystawianie faktur (FV, korekty, duplikaty)
- [ ] Wysyłka faktur (PDF/e-mail)
- [ ] Raporty podstawowe (sprzedaż, VAT)
- [ ] Uprawnienia (jeśli multi-user w przyszłości)
- [ ] Integracje płatności (opcjonalnie; roadmap)

Notatki:

- …

---

## 4) Model danych i integracje

- [ ] Supabase: tabele, klucze, indeksy
- [ ] Modele: Klient, Produkt, Faktura, Pozycja, Płatność
- [ ] Import/Export (CSV, PDF, ewentualnie UBL)
- [ ] Webhooki/API (w przyszłości)
- [ ] Migracje danych (strategia)

Szkic ERD (w punktach):

- Klient (…)
- Produkt (…)
- Faktura (id klienta, waluta, data wystawienia, terminy, …)
- Pozycja (id faktury, id produktu, ilość, cena, VAT, …)
- Płatność (id faktury, kwota, status, …)

---

## 5) UI/UX i front-end

- [ ] Architektura ekranów (Mapa nawigacji)
- [ ] Formularze (walidacje, maski, dostępność)
- [ ] Wydruk/eksport PDF (szablony, marginesy, style)
- [ ] Tailwind v4 + SCSS: design tokens (@theme), paleta kolorów, spacing
- [ ] Komponenty wspólne (przyciski, karty, tabele, modale)

Notatki:

- …

---

## 6) Bezpieczeństwo i prywatność

- [ ] CSP, nagłówki bezpieczeństwa (skonfigurowane w `next.config.ts`)
- [ ] Autoryzacja/logowanie (obecnie solo; później rozbudowa)
- [ ] Przechowywanie danych wrażliwych (hashowanie, szyfrowanie gdzie potrzeba)
- [ ] Zarządzanie sekretami: `.env.local`, Vercel (Prod/Preview)
- [ ] Kopie zapasowe i retencja

Notatki:

- …

---

## 7) Wydania, wersjonowanie, changelog

- [ ] Git Flow (main/develop, feature/release/hotfix)
- [ ] Standard-version (Conventional Commits → CHANGELOG.md)
- [ ] Prereleases (alpha/beta/rc) — ręczna kontrola
- [ ] Procedura wydania (checklista przed tagiem)

Checklista wydania (skrót):

- [ ] Lint/format/test
- [ ] `npm run release` (albo `--release-as`)
- [ ] `git push --follow-tags`
- [ ] Merge na `main` (deploy Vercel)

---

## 8) Testy i jakość

- [ ] Zakres testów jednostkowych (Jest, jsdom)
- [ ] Testy krytycznych przepływów (wystawienie faktury, eksport)
- [ ] Konwencje commitów (Commitlint)
- [ ] Lint (ESLint flat), Stylelint, Prettier

Notatki:

- …

---

## 9) Migracje, kopie zapasowe i utrzymanie

- [ ] Strategia migracji schematu (Supabase)
- [ ] Backupy (czasy, polityka retencji)
- [ ] Monitoring/alerty (później)
- [ ] Plan awaryjny (roll-back release)

Notatki:

- …

---

## 10) Roadmap i priorytety (MVP → v1 → v2)

- [ ] MVP (tydzień/etap)
- [ ] v1 (rozszerzenia)
- [ ] v2 (integracje, automatyzacje, płatności)
- [ ] Kamienie milowe, KPI

Przykładowa oś czasu (do doprecyzowania):

- Tydzień 1: struktura projektu, modele danych MVP
- Tydzień 2: tworzenie klientów/produktów, wystawianie FV
- Tydzień 3: PDF + wysyłka e-mail, testy
- Tydzień 4: raporty podstawowe, polishing, release v1.0.0

---

## Załączniki / linki

- Dokument źródłowy (pełny plan):  
  `/home/aknethstudio/Dokumenty/AKNETH STUDIO/Plan stworzenia systemu fakturowania.md`

- Inne notatki (lokalne; również ignorowane przez Git):
  - `local-notes/git-flow.md`
  - `local-notes/scripts.md`
  - `local-notes/release.md`
