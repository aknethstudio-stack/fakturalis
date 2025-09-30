# hCaptcha Setup Guide

## Konfiguracja hCaptcha dla InvoiceForge

### 1. Utwórz konto hCaptcha

1. Przejdź na https://www.hcaptcha.com/
2. Zarejestruj się lub zaloguj
3. Przejdź do dashboardu: https://dashboard.hcaptcha.com/

### 2. Utwórz nową stronę (site)

1. Kliknij "New Site" w dashboardzie
2. Wypełnij formularz:
   - **Hostname**: `localhost` (dla developmentu) + twoja domena produkcyjna
   - **Site Name**: `InvoiceForge`
   - **Difficulty**: `Easy` (zalecane dla UX)
3. Zapisz ustawienia

### 3. Skopiuj Site Key

1. Po utworzeniu strony, skopiuj **Site Key**
2. Dodaj go do pliku `.env.local`:

```bash
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=your_site_key_here
```

### 4. Konfiguracja w Supabase

1. W dashboardzie Supabase, przejdź do **Authentication → Settings**
2. Znajdź sekcję **Bot and abuse protection**
3. Włącz **Enable Captcha protection**
4. Wpisz swój hCaptcha Site Key

### 5. Konfiguracja środowisk

#### Development

- Hostname: `localhost`
- Port: `3000` (lub inny, którego używasz)

#### Production (Vercel)

- Hostname: twoja domena (np. `invoiceforge.vercel.app`)
- Dodaj zmienną środowiskową w Vercel dashboard

### 6. Testowanie

Test site key (tylko development):

```env
10000000-ffff-ffff-ffff-000000000001
```

**Uwaga**: Ten klucz zawsze zwraca pozytywny wynik. Użyj tylko do testów!

### 7. Bezpieczeństwo

- ✅ Site Key jest publiczny - może być widoczny w kodzie
- ❌ Secret Key trzymaj prywatny (używany tylko server-side)
- 🔄 Rotuj klucze jeśli podejrzewasz kompromitację

### 8. Troubleshooting

**Problem**: hCaptcha nie ładuje się

- Sprawdź czy hostname w dashboardzie hCaptcha pasuje do domeny
- Sprawdź czy `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` jest ustawione

**Problem**: Błąd weryfikacji

- Sprawdź konfigurację w Supabase Auth settings
- Upewnij się, że używasz tego samego Site Key w obu miejscach

**Problem**: "Invalid site key"

- Sprawdź czy kopiowałeś cały klucz bez spacji
- Sprawdź czy hostname się zgadza
