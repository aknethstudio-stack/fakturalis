# InvoiceForge - AI Coding Agent Instructions

## 🏗️ Architecture Overview

**Multi-tenant SaaS** invoicing app with **Row Level Security (RLS)** - every database operation
MUST include `owner_id = auth.uid()`. Core entities: `clients` → `invoices` → `invoice_items` with
optional `products` catalog.

**Stack**: Next.js 15 (App Router) + TypeScript + Supabase + Tailwind CSS v4 + Zod validation +
React Hook Form

## 🔒 Database Security Pattern

ALL user data tables require `owner_id` field for multi-tenant isolation:

```typescript
// ✅ Correct - Always filter by owner_id
const { data } = await supabase.from('clients').select('*').eq('owner_id', user.id);

// ❌ Wrong - Missing tenant isolation
const { data } = await supabase.from('clients').select('*');
```

**Key insight**: Use typed Supabase client from `@/lib/supabase.ts` - it includes complete database
schema types.

## 🛠️ Development Workflow

**CRITICAL**: This project targets low-end hardware (4GB RAM, Celeron). Never use `npm run dev` for
extended development.

**Recommended workflow**:

```bash
# Production-mode development (required for hardware constraints)
npm run build && npm run start

# Quality checks before commit
npm run check  # Runs type-check + lint + stylelint + test:ci
```

**Pre-commit hooks** (Husky) automatically run type-check, lint, format, and commitlint.

## 🇵🇱 Polish Market Specifics

- **VAT compliance**: 23% standard rate, calculations in `@/lib/validations/client.ts`
- **NIP validation**: 10-digit Polish tax ID with checksum validation
- **Address format**: Polish postal codes (XX-XXX pattern)
- **Language**: UI text in Polish, including validation messages
- **Currency**: PLN (Polish Złoty) default

## 📋 Key Patterns

### Validation with Zod

```typescript
// Pattern: Transform + validate in schemas
vat_id: z.string()
  .optional()
  .transform((val) => val?.replace(/[-\s]/g, '') || undefined)
  .refine(validateNIP, { message: 'Nieprawidłowy format NIP' });
```

### Supabase Hooks Usage

```typescript
// Use custom hooks from @/hooks/use-supabase.ts
const { user, loading, signOut } = useAuth();
const supabase = useSupabase();

// Real-time subscriptions
const { data } = useSupabaseSubscription('invoices', `owner_id=eq.${user.id}`);
```

### Form Handling

- **React Hook Form** + **Zod resolvers** for validation
- Error messages in Polish
- Transform data before validation (e.g., clean NIP formatting)

## 🧪 Testing Strategy

- **Jest** + **Testing Library** for component tests
- **Coverage**: Components in `src/` (excluding type definitions)
- **Test pattern**: `*.test.{ts,tsx}` files
- Run with `npm run test:ci` (headless) or `npm run test:watch`

## 📂 File Organization

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components (forms/, layout/, ui/)
├── hooks/           # Custom React hooks (Supabase integration)
├── lib/
│   ├── supabase.ts  # Typed DB client + auth helpers
│   ├── utils.ts     # General utilities
│   └── validations/ # Zod schemas by entity
└── types/           # TypeScript definitions
```

## 🚫 Code Quality Standards

- **NO inline comments** - use clear variable/function names instead
- **JSDoc only** for complex business logic and public functions
- **TypeScript strict mode** - leverage type safety over comments
- **Prettier + ESLint** enforced via pre-commit hooks

## ⚡ Performance Considerations

- **Security headers** configured in `next.config.ts`
- **Aggressive caching** for static assets
- **NO caching** for API routes (sensitive invoice data)
- **Production builds required** for development on target hardware

## 🔄 Git Workflow

- **Git Flow**: `main` (production) + `develop` (integration)
- **Conventional Commits**: `feat(invoice): add VAT calculation`
- **Branch naming**: `feature/INV-123-short-description`

## 🎯 When Making Changes

1. **Always preserve RLS patterns** - include `owner_id` in queries
2. **Validate with Zod** before database operations
3. **Use Polish language** for user-facing text
4. **Test on production build** (`npm run build && npm run start`)
5. **Follow existing patterns** in `@/lib/validations/` for new schemas
6. **Leverage TypeScript** - the Database type in `supabase.ts` is complete

Remember: This is a **working invoicing system** for Polish entrepreneurs - prioritize functionality
and performance over theoretical perfection.
