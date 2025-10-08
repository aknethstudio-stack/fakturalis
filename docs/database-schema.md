# Database Schema

Multi-tenant PostgreSQL schema for InvoiceForge SaaS with Row Level Security.

## Subscription & Billing Tables

### `subscriptions`

User subscription management for freemium pricing model:

```sql
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users not null,
  plan_name text not null check (plan_name in ('free', 'smart', 'business', 'enterprise')),
  status text not null check (status in ('active', 'canceled', 'past_due', 'incomplete')),
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  cancel_at_period_end boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS policies
create policy subscriptions_select on subscriptions for select using (user_id = auth.uid());
create policy subscriptions_update on subscriptions for update using (user_id = auth.uid());
```

### `usage_limits`

Track usage against plan limits:

```sql
create table usage_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users not null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  invoices_count integer default 0,
  users_count integer default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## Tables

### Core Entities

- `clients` - Customer information with Polish NIP validation
- `products` - Service/product catalog with VAT rates
- `invoices` - Invoice headers with KSeF compliance
- `invoice_items` - Line items linking products to invoices
- `payments` - Payment tracking and status

### Schema Design

- Primary keys: `uuid` via `gen_random_uuid()`
- Timestamps: `timestamptz` with UTC default
- Money: `numeric(14,2)` for totals, `numeric(14,4)` for unit prices
- VAT rates: `numeric(5,4)` as ratio (0.23 for 23%)
- Currency: ISO 4217 codes with CHECK constraints

## Row Level Security

All tables use `owner_id = auth.uid()` for tenant isolation:

```sql
create policy clients_select on public.clients
  for select using (owner_id = auth.uid());
```

## Key Indexes

```sql
-- Unique constraints
create unique index invoices_owner_number_ux on invoices(owner_id, number);
create unique index products_owner_sku_ux on products(owner_id, sku) where sku is not null;

-- Performance indexes
create index clients_owner_name_trgm_idx on clients using gin (name gin_trgm_ops);
create index invoices_owner_issue_date_idx on invoices(owner_id, issue_date);
create index invoices_owner_status_idx on invoices(owner_id, status);
```

## Business Rules

- Invoice numbering: Per-owner unique constraint
- VAT validation: Rate between 0 and 1
- Positive amounts: Quantities > 0, prices ≥ 0
- Date validation: Due date ≥ issue date
- Currency consistency: 3-character ISO codes

## Common Queries

### Plan limits validation

```sql
-- Check if user can create more invoices
select
  s.plan_name,
  ul.invoices_count,
  case s.plan_name
    when 'free' then 7
    else null -- unlimited for paid plans
  end as invoice_limit
from subscriptions s
join usage_limits ul on ul.user_id = s.user_id
where s.user_id = auth.uid()
  and s.status = 'active'
  and ul.period_start <= now()
  and ul.period_end > now();
```

### Monthly revenue with plan breakdown

```sql
select
  date_trunc('month', i.issue_date) as month,
  s.plan_name,
  count(*) as invoices_count,
  sum(i.total_gross) as revenue
from invoices i
join subscriptions s on s.user_id = i.owner_id
where i.owner_id = auth.uid()
group by 1, 2 order by 1 desc;
```

### Overdue invoices by plan

```sql
select
  i.*,
  s.plan_name,
  case when s.plan_name in ('business', 'enterprise')
       then 'priority_support'
       else 'standard_support'
  end as support_level
from invoices i
join subscriptions s on s.user_id = i.owner_id
where i.owner_id = auth.uid()
  and i.status in ('issued', 'sent')
  and i.due_date < current_date;
```

### Client search with plan-based features

```sql
select
  c.id,
  c.name,
  c.nip,
  s.plan_name,
  case when s.plan_name = 'free' then false else true end as advanced_search_available
from clients c
join subscriptions s on s.user_id = c.owner_id
where c.owner_id = auth.uid()
  and c.name ilike '%' || $1 || '%'
order by
  case when s.plan_name != 'free' then similarity(c.name, $1) else 0 end desc,
  c.name;
```
