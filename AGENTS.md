# 🤖 AI Agents Guide - Fakturalis

This document provides context and guidelines for AI assistants working on the Fakturalis project.

## 📋 Project Overview

**Fakturalis** is a modern freemium SaaS invoicing application built with Next.js 15, React 19,
TypeScript, Tailwind CSS, and Supabase.

- **Goal**: Competitive invoicing system for Polish market with freemium model
- **Architecture**: Multi-tenant SaaS with Row Level Security and subscription management
- **Pricing**: Free (7 invoices) • Smart (49 PLN) • Business (99 PLN) • Enterprise (299 PLN)
- **Budget**: €0 startup cost (free tiers only) + payment processing integration
- **Timeline**: MVP complete, scaling phase with competitive pricing strategy
- **Target**: Solo entrepreneurs, SMEs, and enterprise clients

## 🏗️ Technical Stack

### Frontend

- **Framework**: Next.js 15.5.4 (App Router)
- **Runtime**: React 19.1.1
- **Language**: TypeScript 5.9.2
- **Styling**: Tailwind CSS v4.1.13 + SCSS
- **Components**: Headless UI 2.2.9, React Icons 5.5.0
- **Forms**: React Hook Form 7.63.0 + Zod 4.1.11 validation
- **State**: TanStack Query 5.90.2 (React Query)
- **PDF Generation**: jsPDF 3.0.3 + jsPDF-AutoTable 5.0.2

### Backend & Database

- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth (via @supabase/ssr 0.7.0)
- **Real-time**: Supabase Realtime subscriptions
- **Storage**: Supabase Storage (for file attachments)
- **API**: Next.js 15 API routes + Supabase client 2.58.0
- **Security**: hCaptcha 1.12.1 for bot protection

### Infrastructure

- **Hosting**: Vercel (frontend)
- **Database**: Supabase (backend)
- **Domain**: Custom domain via Vercel
- **Analytics**: Vercel Analytics
- **Monitoring**: Built-in error tracking

### Development Tools

- **Editor**: Zed (Rust-based, lightweight) + VS Code support
- **Node Version**: 22.x LTS (managed via nvm/nvm-windows)
- **Package Manager**: npm >=10.x
- **Linting**: ESLint 9.36.0 + Prettier 3.6.2
- **Testing**: Jest 30.1.3 + Testing Library 16.3.0
- **Git Hooks**: Husky 9.1.7 + lint-staged 16.2.1
- **CI/CD**: GitHub Actions
- **Security**: Snyk integration for vulnerability scanning

## 🗄️ Database Schema

### Core Tables

- **clients** - Customer information
- **products** - Services/products catalog
- **invoices** - Invoice headers
- **invoice_items** - Invoice line items
- **subscriptions** - User subscription plans and billing
- **usage_limits** - Monthly usage tracking per user

### Key Relationships

- invoices.client_id → clients.id
- invoice_items.invoice_id → invoices.id
- invoice_items.product_id → products.id (nullable)

### Security Model

- **Row Level Security (RLS)** enabled on all tables
- **Multi-tenant**: Each record has owner_id field
- **Auth integration**: owner_id = auth.uid()
- **Policies**: Users can only access their own data

## 🔧 Development Environment

### Hardware Context

- **Target system**: Lenovo IdeaPad 100S (4GB RAM, Celeron N3060, eMMC storage)
- **Memory constraints**: 3.7GB total RAM, swap heavily used
- **Storage**: 58GB eMMC (slow I/O)
- **Performance**: Next.js dev server is too heavy for this hardware

### Recommended Workflow

```bash
# Production-mode development (required for hardware constraints)
npm run build && npm run start

# Quality checks before commit
npm run check  # Runs type-check + lint + stylelint + test:ci

# Traditional dev mode (heavy, avoid on weak hardware)
npm run dev

# Alternative with Turbopack (experimental)
npm run dev:turbo
```

## 🚨 Important Context for AI Agents

### Hardware Limitations

- **Never recommend** npm run dev for extended use
- **Always suggest** production-mode development workflow
- **Be mindful** of memory and CPU constraints
- **Prefer** lightweight solutions and optimizations

### Polish Market Requirements

- **VAT compliance** is critical (23% standard rate)
- **KSeF integration** required for B2B invoices
- **Polish language** UI and documentation
- **Currency**: PLN (Polish Złoty)
- **Address format**: Polish postal codes (XX-XXX)

### SaaS Architecture

- **Multi-tenant** design is intentional
- **RLS policies** must be maintained
- **owner_id** field required in all user data tables
- **Supabase Auth** integration is mandatory

### Development Philosophy

- **MVP first** - basic functionality over perfection
- **Iterative improvement** - small, working increments
- **User-centric** - use the app for real invoices
- **Performance-conscious** - respect hardware limitations

## ⚠️ Common Pitfalls to Avoid

1. **Don't suggest** heavy development workflows
2. **Don't ignore** RLS and multi-tenant architecture
3. **Don't assume** unlimited resources or modern hardware
4. **Don't skip** TypeScript type safety
5. **Don't forget** Polish market requirements
6. **Don't break** existing database constraints
7. **Don't recommend** unnecessary dependencies

---

**Remember**: Fakturalis aims to be a practical, working solution for Polish entrepreneurs.
Prioritize functionality, performance, and user experience over theoretical perfection.

## 💰 Business Model & Pricing

### Freemium SaaS Strategy

- **Free Plan**: 7 invoices/month - customer acquisition and validation
- **Smart Plan**: 49 PLN/month - growing SMEs with unlimited invoices
- **Business Plan**: 99 PLN/month - established businesses with teams
- **Enterprise Plan**: 299 PLN/month - large organizations with custom needs

### Competitive Positioning

- **vs inFakt**: 2.5x price for modern tech stack and better UX
- **vs Fakturownia**: 14% premium for React 19 performance
- **vs iFirma**: 10% discount as competitive alternative
- **Value Props**: Modern UI, real-time features, mobile-first, API access

### Key Metrics

- **Target CAC/CLV**: 1:7 to 1:12 ratio
- **Conversion Goals**: 25% free-to-paid, <10% annual churn
- **Plan Distribution**: 60% Smart, 30% Business, 10% Enterprise

## 📝 Code Documentation Standards

### Comments Policy

- **ONLY JSDoc/TSDoc docstrings** for functions, classes, and complex logic
- **NO inline comments** or explanatory comments in code
- **Self-documenting code** - use clear variable and function names
- **Type annotations** instead of comments for type clarification

### Good Examples

```typescript
/**
 * Calculates total invoice amount including VAT
 * @param netAmount - Net amount before tax
 * @param vatRate - VAT rate as percentage (e.g., 23 for 23%)
 * @returns Total gross amount with VAT included
 */
function calculateGrossAmount(netAmount: number, vatRate: number): number {
  return netAmount * (1 + vatRate / 100);
}

/**
 * Validates Polish NIP (tax identification number)
 * @param nip - NIP number as string
 * @returns true if NIP is valid, false otherwise
 */
function validatePolishNIP(nip: string): boolean {
  // Implementation without inline comments
  const cleanNip = nip.replace(/[-\s]/g, '');
  return cleanNip.length === 10 && /^\d{10}$/.test(cleanNip);
}
```

### Avoid

```typescript
// BAD: Inline comments explaining obvious code
const total = price * quantity; // multiply price by quantity
const vatAmount = total * 0.23; // calculate 23% VAT

// BAD: Explanatory comments instead of clear naming
const result = calc(a, b); // calculate invoice total
```

### When to Use Docstrings

- ✅ **Public functions and methods**
- ✅ **Complex business logic** (VAT calculations, KSeF formatting)
- ✅ **API endpoints and database functions**
- ✅ **React components with non-obvious props**
- ✅ **Utility functions used across modules**

### When NOT to Comment

- ❌ **Self-explanatory code**
- ❌ **Simple variable assignments**
- ❌ **Standard React patterns**
- ❌ **Basic CRUD operations**

## 🌿 Git Flow & Development Workflow

### Branching Strategy

**Git Flow model** with `main` (production) + `develop` (integration):

- **main** → Production deployment (Vercel)
- **develop** → Integration branch for features
- **feature/** → New functionality branches
- **release/** → Release preparation
- **hotfix/** → Critical production fixes

### Branch Naming Conventions

- feature/short-description
- fix/short-description
- release/1.2.3
- hotfix/1.2.4

Branch naming nie wymaga numerów ticketów ani formalnych zgłoszeń. Zgłaszanie issue na GitHub jest dostępne dla wszystkich użytkowników – możesz raportować błędy, pomysły i zadania zgodnie z potrzebami projektu.

### Commit Message Format

**Conventional Commits** enforced by commitlint:

- feat(invoice): add VAT calculation
- fix(pdf): correct page margins
- docs(readme): update setup instructions
- chore(deps): update dependencies

**Types**: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert

### Code Quality Gates

**Pre-commit hooks** (Husky) automatically run:

- npm run type-check - TypeScript validation
- npm run lint - ESLint checks
- npm run format - Prettier formatting
- npm run stylelint - Stylelint for CSS/SCSS
- commitlint - Commit message validation

**Pre-build hooks** ensure quality:

- Type checking before development and build
- All checks run before build (check script)
- Test suite must pass before build

### Database Operations Standards

- **Always use owner_id** for multi-tenant isolation
- **Validate with Zod** schemas before database operations
- **Handle errors gracefully** with user-friendly messages
- **Use transactions** for multi-table operations

### Key Patterns

#### Validation with Zod

```typescript
// Pattern: Transform + validate in schemas
vat_id: z.string()
  .optional()
  .transform((val) => val?.replace(/[-\s]/g, '') || undefined)
  .refine(validateNIP, { message: 'Nieprawidłowy format NIP' });
```

#### Supabase Hooks Usage

```typescript
// Use custom hooks from @/hooks/use-supabase.ts
const { user, loading, signOut } = useAuth();
const supabase = useSupabase();

// Real-time subscriptions
const { data } = useSupabaseSubscription('invoices', `owner_id=eq.${user.id}`);
```

#### Form Handling

- **React Hook Form** + **Zod resolvers** for validation
- Error messages in Polish
- Transform data before validation (e.g., clean NIP formatting)
