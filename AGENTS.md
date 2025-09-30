# 🤖 AI Agents Guide - InvoiceForge

This document provides context and guidelines for AI assistants working on the InvoiceForge project.

## 📋 Project Overview

**InvoiceForge** is a modern SaaS invoicing application built with Next.js 14, TypeScript, Tailwind
CSS, and Supabase.

- **Goal**: Professional invoicing system for Polish market
- **Architecture**: Multi-tenant SaaS with Row Level Security
- **Budget**: €0 startup cost (free tiers only)
- **Timeline**: 16-week development plan
- **Target**: Solo entrepreneurs and small businesses

## 🏗️ Technical Stack

### Frontend

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + SCSS
- **Components**: Headless UI, Radix UI
- **Forms**: React Hook Form + Zod validation
- **State**: TanStack Query (React Query)
- **Icons**: Lucide React

### Backend & Database

- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth
- **Real-time**: Supabase Realtime subscriptions
- **Storage**: Supabase Storage (for file attachments)
- **API**: Next.js API routes + Supabase client

### Infrastructure

- **Hosting**: Vercel (frontend)
- **Database**: Supabase (backend)
- **Domain**: Custom domain via Vercel
- **Analytics**: Vercel Analytics
- **Monitoring**: Built-in error tracking

### Development Tools

- **Editor**: Zed (Rust-based, lightweight)
- **Node Version**: 22.x LTS (managed via nvm + Oh My Zsh plugin)
- **Package Manager**: npm
- **Linting**: ESLint + Prettier
- **Testing**: Jest + Testing Library
- **Git Hooks**: Husky + lint-staged
- **CI/CD**: GitHub Actions

## 🗄️ Database Schema

### Core Tables

- **clients** - Customer information
- **products** - Services/products catalog
- **invoices** - Invoice headers
- **invoice_items** - Invoice line items

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
# Production-mode development (recommended for low-end hardware)
npm run build && npm run start

# Traditional dev mode (heavy, avoid on weak hardware)
npm run dev

# Type checking
npm run type-check

# Testing
npm run test
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

**Remember**: InvoiceForge aims to be a practical, working solution for Polish entrepreneurs.
Prioritize functionality, performance, and user experience over theoretical perfection.

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

- feature/INV-123-short-description
- fix/INV-456-bug-description
- release/1.2.3
- hotfix/1.2.4

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
- commitlint - Commit message validation

### Database Operations Standards

- **Always use owner_id** for multi-tenant isolation
- **Validate with Zod** schemas before database operations
- **Handle errors gracefully** with user-friendly messages
- **Use transactions** for multi-table operations
