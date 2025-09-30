# Tailwind CSS v4 + SCSS — ściągawka (local)

Ten plik to szybki przewodnik po użyciu Tailwind CSS v4 w tym projekcie (z SCSS i Next.js).
Skoncentrowane na praktyce, gotowe do kopiowania fragmenty.

— Tailwind v4 (bez PostCSS pluginu)  
— SCSS globalny, warstwy i @theme  
— Współpraca z Next.js (App Router)  
— Przykłady i najczęstsze pułapki

---

## 0) TL;DR (co jest najważniejsze w v4)

- Nie instalujesz ani nie ładujesz Tailwinda jako pluginu PostCSS.  
  W globalnym SCSS używasz:
  ```scss
  @import 'tailwindcss';
  ```
- Design tokens definiujesz w CSS przez `@theme` (to tworzy nowe utilsy/varianty):
  ```scss
  @theme {
    --color-brand: oklch(69% 0.15 248);
    --breakpoint-3xl: 120rem;
    --radius-xl: 1rem;
  }
  ```
- Nie ma `content/purge` w configu — Tailwind v4 generuje tylko używane zmienne.
- Plik konfiguracyjny Tailwinda jest opcjonalny. Używasz go głównie do pluginów
  (`tailwind.config.js/ts`).
- Warstwy (kolejność): `theme`, `base`, `components`, `utilities`.

---

## 1) Globalny SCSS (wejście)

Plik: `src/styles/global.scss`

Minimalna wersja (już skonfigurowana w projekcie):

```scss
/*! Global styles (SCSS) */
@import 'tailwindcss';

@layer base {
  html,
  body {
    height: 100%;
  }

  body {
    margin: 0;
    font-family: var(--font-sans);
  }
}
```

Dodanie własnych tokenów:

```scss
@theme {
  /* Kolor firmowy dostępny jako bg-brand / text-brand */
  --color-brand: oklch(69% 0.15 248);
  /* Dodatkowy breakpoint → wariant 3xl: */
  --breakpoint-3xl: 120rem;
  /* Dodatkowy promień: powiązany z rounded-xl (jeśli zmapujesz nazwę) */
  --radius-xl: 1rem;
}
```

---

## 2) @theme — jak działa i co daje

- Definiujesz nazwy w “namespace’ach” (kolory, spacing, typografia, cienie, breakpoints itd.).
- Tailwind generuje klasy i/lub warianty odpowiadające Twoim nazwom:

Przykłady:

```scss
@theme {
  /* Kolory → klasy: bg-brand, text-brand, border-brand, fill-brand, itp. */
  --color-brand: oklch(69% 0.15 248);

  /* Breakpointy → warianty responsywne: 3xl:* */
  --breakpoint-3xl: 120rem;

  /* Cienie (drop-shadow-*, shadow-*) */
  --shadow-floating: 0 10px 30px rgb(0 0 0 / 0.15);

  /* Promienie → rounded-xxl (jeśli nazwy pasują do schematu radius-*) */
  --radius-xxl: 1.25rem;
}
```

Uwaga praktyczna:

- Domyślny temat (theme.css) dostarcza wiele zmiennych (np. `--font-sans`, `--color-*`,
  `--radius-*`), więc często rozszerzasz zamiast nadpisywać wszystko.
- Jeśli chcesz generować WSZYSTKIE zmienne statycznie (nawet nieużywane), możesz użyć:
  ```scss
  @theme static {
    --color-primary: var(--color-blue-500);
  }
  ```

---

## 3) Warstwy i własne komponenty w SCSS

Warstwy CSS:

- `@layer theme` (ładowane przez `@import "tailwindcss"` → theme.css)
- `@layer base` (reset/preflight + Twoje podstawy)
- `@layer components` (Twoje komponenty/abstrakcje)
- `@layer utilities` (Twoje dodatkowe utilsy)

Przykład własnego komponentu:

```scss
@layer components {
  .btn {
    @apply inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium;
    @apply bg-brand text-white shadow-sm;
    transition: box-shadow 0.2s ease;

    &:hover {
      @apply opacity-95;
    }

    &:active {
      filter: brightness(0.98);
    }
  }

  .card {
    @apply rounded-lg border border-gray-200 bg-white p-6 shadow-sm;
  }
}
```

Własne utilsy:

```scss
@layer utilities {
  .text-brand {
    color: var(--color-brand);
  }
  .bg-brand {
    background: var(--color-brand);
  }
}
```

---

## 4) Responsywność i warianty

- Breakpointy z `@theme` tworzą warianty: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`, plus Twoje (np.
  `3xl:`).
- Przykład siatki z dodatkowym breakpointem:

```html
<div class="3xl:grid-cols-6 grid grid-cols-2 gap-4 md:grid-cols-4">...</div>
```

---

## 5) SCSS, zmienne i wartości arbitralne

Łączenie Tailwindowych zmiennych z SCSS i arbitralnymi wartościami:

```html
<div class="relative rounded-xl">
  <div class="absolute inset-px rounded-[calc(var(--radius-xl)-1px)]">...</div>
</div>
```

Zwykle:

- “Arbitrary values” pozwalają użyć `calc()` i odwołać się do `var(--*)`.
- Możesz też stosować zmienne w zwykłym SCSS w @layer components/utilities.

---

## 6) Next.js — gdzie importować globalny SCSS

App Router (zalecany):

- `src/app/layout.tsx` powinien importować:
  ```ts
  import '@/styles/global.scss';
  ```
- Nie importuj Tailwinda w wielu miejscach — globalny import jest jeden.

---

## 7) Konfiguracja (opcjonalna)

Plik `tailwind.config.js` (ESM) jest opcjonalny w v4.  
Służy głównie do pluginów:

```js
/** @type {import('tailwindcss').Config} */
export default {
  plugins: [
    // np. import forms from '@tailwindcss/forms'
    // forms(),
  ],
};
```

Nie dodawaj `purge/content/darkMode/variants` — to przeszłość (v2/v3).

---

## 8) PostCSS i Prettier

- PostCSS: używamy tylko `autoprefixer`. Nie dodawaj `tailwindcss` do PostCSS.  
  Plik: `postcss.config.cjs`
- Prettier: klasami Tailwinda zajmuje się `prettier-plugin-tailwindcss`.  
  Klasy będą sortowane automatycznie.

---

## 9) Najczęstsze pułapki i debug

- “Gdzie config Tailwinda?” → w v4 nie jest wymagany. Temat i utilsy są w CSS
  (`@import "tailwindcss";`, `@theme`).
- “Brak styli Tailwinda” → sprawdź, czy globalny SCSS jest zaimportowany w `layout.tsx`.
- “Nie generuje moich klas” → pamiętaj, że wiele utilsy wynika z `@theme`.  
  Dodaj tokeny w `@theme` aby powstały odpowiadające klasy/varianty.
- “Stylelint krzyczy o @theme” → mamy skonfigurowane ignorowanie tych dyrektyw (zob.
  `.stylelintrc.cjs`).
- “Chcę dark mode” → w v4 opieraj się na CSS i zmiennych; możesz zdefiniować alternatywne wartości w
  `@media (prefers-color-scheme: dark)` lub pod klasą `.dark` i tam nadpisać tokeny w
  `@theme inline` lub zwykłe `:root { --* }`. Dobierz wariant do projektu.

Przykład prostego trybu dark (nadpisanie kolorów):

```scss
@media (prefers-color-scheme: dark) {
  @theme {
    --color-brand: oklch(70% 0.12 250); /* przykład lekkiego przesunięcia */
  }
}
```

---

## 10) Wzorce i przykłady

Kompozycja kart + przycisk:

```html
<div class="card space-y-3">
  <h2 class="text-xl font-semibold">Nowa faktura</h2>
  <p class="text-gray-600">Utwórz dokument i wyślij do klienta</p>
  <button class="btn">Dodaj</button>
</div>
```

Utility z arbitralną wartością obramowania:

```html
<div class="rounded-[var(--radius-xxl)] border border-gray-200 p-6">...</div>
```

Grid responsywny z niestandardowym breakpointem:

```html
<div class="3xl:grid-cols-6 grid grid-cols-2 gap-4 md:grid-cols-4">
  <div class="rounded-md border border-gray-200 p-3 text-center">1</div>
  ...
</div>
```

---

## 11) Migracja z v3 (skrót)

- Usuń stare `tailwind.config.js` pola: `content/purge`, `darkMode`, `variants`.
- Przenieś modyfikacje tematu do `@theme` w CSS, a nie do `theme.extend` w configu.
- Usuń Tailwinda z PostCSS pluginów (tylko `autoprefixer`).
- Zastąp `@tailwind base; @tailwind components; @tailwind utilities;` → `@import "tailwindcss";`
- Upewnij się, że Prettier z pluginem do sortowania klas działa (lokalna instalacja, restart serwera
  formatowania w edytorze po zmianach).

---

## 12) Checklista wdrożenia

- [ ] `src/styles/global.scss` ma `@import "tailwindcss";`
- [ ] `@theme` zawiera Twoje tokeny (kolory, breakpointy, itp.)
- [ ] `layout.tsx` importuje `@/styles/global.scss`
- [ ] `postcss.config.cjs` → tylko `autoprefixer`
- [ ] Prettier + `prettier-plugin-tailwindcss` zainstalowane
- [ ] Stylelint skonfigurowany dla SCSS i dyrektyw Tailwinda

---

## 13) Linki

- Dokumentacja v4 (temat i zmienne): https://tailwindcss.com/docs/configuration
- Default theme variables (przykłady kolorów, promieni, cieni): `node_modules/tailwindcss/theme.css`
- Next.js CSS: https://nextjs.org/docs/app/building-your-application/styling/css
- Prettier plugin (Tailwind): https://github.com/tailwindlabs/prettier-plugin-tailwindcss
