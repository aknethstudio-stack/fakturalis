# Database Schema

Multi-tenant PostgreSQL schema for InvoiceForge with Row Level Security.

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

### Monthly revenue

```sql
select date_trunc('month', issue_date) as month,
       sum(total_gross) as revenue
from invoices
where owner_id = auth.uid()
group by 1 order by 1;
```

### Overdue invoices

```sql
select * from invoices
where owner_id = auth.uid()
  and status in ('issued', 'sent')
  and due_date < current_date;
```

### Client search

```sql
select id, name from clients
where owner_id = auth.uid()
  and name ilike '%' || $1 || '%'
order by similarity(name, $1) desc;
```
