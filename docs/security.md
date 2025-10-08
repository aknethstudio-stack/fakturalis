# 🔒 Bezpieczeństwo InvoiceForge

## Zaimplementowane warstwy bezpieczeństwa

1. **Content Security Policy (CSP)** - ochrona przed XSS
2. **Security Headers** - HSTS, X-Frame-Options, etc.
3. **hCaptcha** - ochrona przed botami i spam registracji
4. **Supabase RLS** - Row Level Security, izolacja multi-tenant SaaS
5. **Sentry** - monitoring błędów i bezpieczeństwa w production
6. **Rate Limiting** - ograniczenia żądań per IP/user/plan
7. **Input Sanitization** - DOMPurify dla HTML/XSS
8. **Audit Logging** - logowanie krytycznych operacji (faktury, subskrypcje)
9. **Environment Validation** - walidacja zmiennych środowiskowych
10. **Session Security** - bezpieczne sesje i ciasteczka
11. **Payment Security** - PCI DSS compliance via Stripe/PayU
12. **Subscription Security** - plan validation i usage limits

## Użycie

### Rate Limiting

```typescript
import { createRateLimitMiddleware } from '@/lib/rate-limit';

const rateLimitMiddleware = createRateLimitMiddleware('auth');
const rateLimitResponse = await rateLimitMiddleware(request);
if (rateLimitResponse) return rateLimitResponse;
```

### Input Sanitization

```typescript
import { sanitizeClientData, sanitizeInvoiceData } from '@/lib/sanitize';

const cleanData = sanitizeClientData(formData);
```

### Audit Logging & Subscription Security

```typescript
import { auditLogger } from '@/lib/audit';

// Log invoice operations
await auditLogger.logInvoice('create', invoiceId, userId, request);

// Log subscription changes
await auditLogger.logSubscription('upgrade', userId, { from: 'free', to: 'smart' });

// Log payment processing
await auditLogger.logPayment('success', paymentId, userId, { amount: 49, plan: 'smart' });
```

### Environment Validation

```typescript
import { getEnvironment } from '@/lib/env';

const env = getEnvironment();
```

## Konfiguracja

### Development

```bash
NEXT_PUBLIC_SUPABASE_URL=your_dev_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_dev_key
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=your_dev_hcaptcha
HCAPTCHA_SECRET_KEY=your_dev_secret
```

### Production

```bash
NEXT_PUBLIC_SUPABASE_URL=your_prod_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_prod_key
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
SENTRY_DSN=your_sentry_dsn
```

## Security Checklist

- [ ] SSL/TLS certificates aktywne
- [ ] CSP headers skonfigurowane
- [ ] Rate limiting na API endpoints
- [ ] Input sanitization w formularzach
- [ ] Audit logging dla krytycznych operacji
- [ ] Environment variables walidowane
- [ ] Secure cookies i session timeout
- [ ] Supabase RLS policies aktywne
- [ ] Regular security updates
- [ ] Monitoring i alerting

## Usługi zewnętrzne (opcjonalne)

- **Rate limiting** - działa lokalnie lub z Redis (Upstash free tier: 10k requests/day)
- **Error monitoring** - Sentry (free tier: 5k errors/month)
- **Database** - Supabase (free tier: 50k requests/month)

Bezpieczeństwo bazowe: **$0/miesiąc** - wbudowane w kod

## 📋 Implementacja

### Rate Limiting

```typescript
import { createRateLimitMiddleware } from '@/lib/rate-limit';

// W API route
const rateLimitMiddleware = createRateLimitMiddleware('auth');
const rateLimitResponse = await rateLimitMiddleware(request);
if (rateLimitResponse) return rateLimitResponse;
```

### Input Sanitization

```typescript
import { sanitizeClientData, sanitizeInvoiceData } from '@/lib/sanitize';

// Czyść dane przed zapisem do bazy
const cleanData = sanitizeClientData(formData);
```

### Audit Logging

```typescript
import { auditLogger } from '@/lib/audit';

// Loguj krytyczne operacje
await auditLogger.logInvoice('create', invoiceId, userId, request);
```

### Environment Validation

```typescript
import { getEnvironment } from '@/lib/env';

// Sprawdź zmienne środowiskowe na starcie
const env = getEnvironment();
```

## 🚧 **Kolejne kroki (rekomendowane):**

### 11. **Database Encryption at Rest**

- Supabase automatycznie szyfruje dane w spoczynku
- ✅ Już aktywne

### 12. **API Key Management**

- Rotacja kluczy API co 90 dni
- Monitoring użycia kluczy
- Separate keys per environment

### 13. **Security Monitoring**

```bash
npm install @sentry/integrations
```

### 14. **Backup & Recovery**

- Automatyczne backupy bazy danych
- Recovery procedures
- Data retention policies

### 15. **Penetration Testing**

- Regularne testy penetracyjne
- OWASP Top 10 compliance
- Security audits

### 16. **Compliance (RODO/GDPR)**

- Data Processing Agreements
- Privacy Policy updates
- User consent management
- Right to be forgotten

## 🔧 **Konfiguracja w środowiskach:**

### Development

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_dev_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_dev_key
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=your_dev_hcaptcha
HCAPTCHA_SECRET_KEY=your_dev_secret
```

### Production

```bash
# Vercel Environment Variables
NEXT_PUBLIC_SUPABASE_URL=your_prod_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_prod_key
UPSTASH_REDIS_REST_URL=your_redis_url    # Rate limiting
UPSTASH_REDIS_REST_TOKEN=your_redis_token
SENTRY_DSN=your_sentry_dsn               # Error monitoring
```

## 🚨 **Security Checklist:**

- [ ] SSL/TLS certificates aktywne
- [ ] CSP headers skonfigurowane
- [ ] Rate limiting na wszystkich API endpoints
- [ ] Input sanitization w formularzach
- [ ] Audit logging dla krytycznych operacji
- [ ] Environment variables walidowane
- [ ] Secure cookies i session timeout
- [ ] Supabase RLS policies aktywne
- [ ] Regular security updates
- [ ] Monitoring i alerting
- [ ] Backup procedures
- [ ] Incident response plan

## 🎯 **Priorytet implementacji:**

1. **Wysoki** - Rate limiting, Input sanitization ✅
2. **Średni** - Audit logging, Environment validation ✅
3. **Niski** - Advanced monitoring, Compliance tools

## 💡 **Wskazówki:**

- Regularnie aktualizuj dependencies
- Monitoruj CVE dla używanych bibliotek
- Testuj bezpieczeństwo w CI/CD
- Dokumentuj wszystkie zmiany bezpieczeństwa
- Szkolenia team z security best practices
