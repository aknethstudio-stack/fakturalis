# 📊 Logging Guidelines - InvoiceForge

## 🎯 **Zasady logowania**

### ❌ **NIE używaj**

```typescript
console.error('Something went wrong', error);
console.warn('Warning message');
console.log('Debug info');
```

### ✅ **Używaj zamiast tego**

```typescript
import { logger } from '@/lib/logger';

// Błędy - będą wysyłane do Sentry w production
logger.error('Something went wrong', error, { userId: 'user123' });

// Ostrzeżenia - będą wysyłane do Sentry w production
logger.warn('Deprecated API used');

// Info/Debug - tylko w development
logger.info('User logged in', { userId: 'user123' });
logger.debug('Processing data', { dataSize: items.length });
```

## 🔧 **Konfiguracja**

### Environment Variables

- `NODE_ENV=production` - automatycznie włącza Sentry
- `SENTRY_ENABLED=true` - force enable Sentry w development

### Sentry Integration

- **Production**: Wszystkie błędy i warnings → Sentry
- **Development**: Wszystkie logi → console + opcjonalnie Sentry

## 📝 **Wzorce użycia**

### API Routes

```typescript
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    // ... kod
  } catch (error) {
    logger.error('API endpoint failed', error, {
      endpoint: '/api/example',
      method: 'POST',
    });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

### Components

```typescript
import { logger } from '@/lib/logger';

export function MyComponent() {
  const handleError = (error: Error) => {
    logger.error('Component error', error, {
      component: 'MyComponent',
      action: 'handleSubmit',
    });
  };
}
```

### Forms/Validation

```typescript
catch (error) {
  if (error instanceof z.ZodError) {
    logger.warn('Validation failed', { issues: error.issues });
  } else {
    logger.error('Form submission failed', error);
  }
}
```

## 🚨 **Co migrować**

Znajdź i zamień wszystkie wystąpienia:

| Stary kod                 | Nowy kod                 |
| ------------------------- | ------------------------ |
| `console.error(msg, err)` | `logger.error(msg, err)` |
| `console.warn(msg)`       | `logger.warn(msg)`       |
| `console.log(msg)`        | `logger.info(msg)`       |
| `console.debug(msg)`      | `logger.debug(msg)`      |

## 🎖️ **Korzyści**

- ✅ **Centralized logging** - jeden sposób na wszystkie logi
- ✅ **Production monitoring** - błędy automatycznie w Sentry
- ✅ **Development experience** - nadal wszystko w console
- ✅ **Configurable** - można włączyć/wyłączyć Sentry
- ✅ **Structured data** - dodatkowe metadata dla błędów
