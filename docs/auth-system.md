# Authentication System

## Przegląd

Fakturalis używa **Supabase Auth** z dodatkowymi zabezpieczeniami **hCaptcha** dla ochrony przed
botami.

## Komponenty systemu

### 1. Strony uwierzytelniania

- `/auth/login` - Logowanie użytkownika
- `/auth/signup` - Rejestracja nowego konta
- `/auth/reset-password` - Reset hasła
- `/auth/logout` - Wylogowanie użytkownika

### 2. API Routes

- `/api/auth/callback` - Obsługa callback z Supabase
- `/api/auth/signout` - Server-side wylogowanie

### 3. Middleware

- `middleware.ts` - Ochrona tras, przekierowania auth

### 4. Hooks i utilities

- `useAuth()` - Hook do operacji uwierzytelniania
- `useSupabase()` - Klient Supabase
- Walidacja formularzy z **Zod**

## Bezpieczeństwo

### Row Level Security (RLS)

Każda tabela ma `owner_id` field dla izolacji multi-tenant:

```sql
-- Przykład polityki RLS
CREATE POLICY "Users can only see own data" ON clients
FOR ALL USING (auth.uid() = owner_id);
```

### hCaptcha Protection

Wszystkie formularze auth są zabezpieczone hCaptcha:

- Blokuje boty
- Zapobiega spam registracji
- Chroni przed atakami brute force

### Sesje i ciasteczka

- Automatyczne zarządzanie tokenami
- Bezpieczne przechowywanie w cookies
- Odświeżanie tokenów w tle

## Konfiguracja

1. **Supabase**: Ustaw zmienne środowiskowe
2. **hCaptcha**: Skonfiguruj Site Key
3. **Middleware**: Zdefiniuj chronione ścieżki

Zobacz `docs/hcaptcha-setup.md` dla szczegółów.

## Flow uwierzytelniania

### Rejestracja

1. Użytkownik wypełnia formularz signup
2. Weryfikacja hCaptcha
3. Supabase wysyła email potwierdzenia
4. Użytkownik klika link w emailu
5. Konto zostaje aktywowane

### Logowanie

1. Użytkownik podaje email/hasło
2. Weryfikacja hCaptcha
3. Supabase sprawdza dane
4. Sesja zostaje utworzona
5. Przekierowanie do dashboard

### Reset hasła

1. Użytkownik podaje email
2. Weryfikacja hCaptcha (opcjonalnie)
3. Supabase wysyła link resetujący
4. Użytkownik ustawia nowe hasło

## Rozwój

### Testowanie locally

```bash
# Użyj test hCaptcha key
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=10000000-ffff-ffff-ffff-000000000001

# Start development server
npm run build && npm run start
```

### Debugowanie

- Sprawdź Network tab dla błędów Supabase
- Console.log w `/api/auth/callback`
- Logs w Supabase dashboard

## Security best practices

- ✅ Waliduj dane po stronie serwera
- ✅ Używaj HTTPS w production
- ✅ Regularnie aktualizuj zależności
- ✅ Monitoruj próby włamania
- ❌ Nie przechowuj haseł w plain text
- ❌ Nie loguj tokenów auth w console
