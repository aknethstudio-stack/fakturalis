-- Fakturalis Database Setup - PostgreSQL/Supabase
-- Skopiuj i wklej do Supabase SQL Editor: https://supabase.com/dashboard/project/xavvzxbpmqkbfsugkxgt/sql
-- @language postgresql

-- Helper function for updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Enums for statuses
do $$
begin
  if not exists (select 1 from pg_type where typname = 'invoice_status') then
    create type public.invoice_status as enum ('draft','issued','sent','paid','overdue','voided','cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum ('pending','completed','failed','refunded');
  end if;
end
$$;

-- CLIENTS TABLE
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  vat_id text,
  email text,
  phone text,
  address_line1 text,
  address_line2 text,
  postal_code text,
  city text,
  country_code text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clients_name_not_blank check (btrim(name) <> '')
);

create trigger clients_set_updated_at before update on public.clients
for each row execute function public.set_updated_at();

-- PRODUCTS TABLE
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sku text,
  unit text default 'szt',
  unit_price numeric(14,4) not null default 0,
  vat_rate_default numeric(5,4) not null default 0.23,
  currency text not null default 'PLN',
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_name_not_blank check (btrim(name) <> ''),
  constraint products_vat_rate_valid check (vat_rate_default >= 0 and vat_rate_default <= 1),
  constraint products_currency_len check (char_length(currency) = 3)
);

create trigger products_set_updated_at before update on public.products
for each row execute function public.set_updated_at();

-- INVOICES TABLE
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,
  number text not null,
  status public.invoice_status not null default 'draft',
  issue_date date not null default (now() at time zone 'utc')::date,
  due_date date not null,
  currency text not null default 'PLN',
  subtotal_net numeric(14,2) not null default 0,
  total_vat numeric(14,2) not null default 0,
  total_gross numeric(14,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invoices_number_not_blank check (btrim(number) <> ''),
  constraint invoices_currency_len check (char_length(currency) = 3),
  constraint invoices_dates check (due_date >= issue_date)
);

create unique index if not exists invoices_owner_number_ux on public.invoices(owner_id, number);
create trigger invoices_set_updated_at before update on public.invoices
for each row execute function public.set_updated_at();

-- INVOICE_ITEMS TABLE
create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  quantity numeric(14,4) not null default 1,
  unit text default 'szt',
  unit_price numeric(14,4) not null default 0,
  vat_rate numeric(5,4) not null default 0.23,
  line_net numeric(14,2) not null default 0,
  line_vat numeric(14,2) not null default 0,
  line_gross numeric(14,2) not null default 0,
  position int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invoice_items_name_not_blank check (btrim(name) <> ''),
  constraint invoice_items_qty_positive check (quantity > 0),
  constraint invoice_items_vat_rate_valid check (vat_rate >= 0 and vat_rate <= 1)
);

create index if not exists invoice_items_invoice_idx on public.invoice_items(invoice_id);
create trigger invoice_items_set_updated_at before update on public.invoice_items
for each row execute function public.set_updated_at();

-- ROW LEVEL SECURITY - ENABLE
alter table public.clients enable row level security;
alter table public.products enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;

-- RLS POLICIES - CLIENTS
create policy clients_select on public.clients for select using (owner_id = auth.uid());
create policy clients_insert on public.clients for insert with check (owner_id = auth.uid());
create policy clients_update on public.clients for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy clients_delete on public.clients for delete using (owner_id = auth.uid());

-- RLS POLICIES - PRODUCTS
create policy products_select on public.products for select using (owner_id = auth.uid());
create policy products_insert on public.products for insert with check (owner_id = auth.uid());
create policy products_update on public.products for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy products_delete on public.products for delete using (owner_id = auth.uid());

-- RLS POLICIES - INVOICES
create policy invoices_select on public.invoices for select using (owner_id = auth.uid());
create policy invoices_insert on public.invoices for insert with check (owner_id = auth.uid());
create policy invoices_update on public.invoices for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy invoices_delete on public.invoices for delete using (owner_id = auth.uid());

-- RLS POLICIES - INVOICE_ITEMS
create policy invoice_items_select on public.invoice_items for select using (owner_id = auth.uid());
create policy invoice_items_insert on public.invoice_items for insert with check (owner_id = auth.uid());
create policy invoice_items_update on public.invoice_items for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy invoice_items_delete on public.invoice_items for delete using (owner_id = auth.uid());

-- CONVENIENCE DEFAULTS
alter table public.clients alter column owner_id set default auth.uid();
alter table public.products alter column owner_id set default auth.uid();
alter table public.invoices alter column owner_id set default auth.uid();
alter table public.invoice_items alter column owner_id set default auth.uid();

-- SEARCH INDEXES
create index if not exists clients_owner_name_idx on public.clients(owner_id, name);
create index if not exists products_owner_name_idx on public.products(owner_id, name);
create index if not exists invoices_owner_issue_date_idx on public.invoices(owner_id, issue_date);
create index if not exists invoices_owner_status_idx on public.invoices(owner_id, status);

-- DICTIONARY TABLES - For KSeF compliance and standardization

-- VAT RATES TABLE - Stawki VAT zgodne z polskim prawem
create table if not exists public.vat_rates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  rate numeric(5,4) not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint vat_rates_code_not_blank check (btrim(code) <> ''),
  constraint vat_rates_name_not_blank check (btrim(name) <> ''),
  constraint vat_rates_rate_valid check (rate >= 0 and rate <= 1)
);

-- RLS for vat_rates - PUBLIC READ-ONLY
alter table public.vat_rates enable row level security;
create policy vat_rates_select on public.vat_rates for select using (true);

-- Insert Polish VAT rates
insert into public.vat_rates (code, name, rate, description) values
  ('23', '23%', 0.23, 'Stawka podstawowa VAT'),
  ('8', '8%', 0.08, 'Stawka obniżona VAT 8%'),
  ('5', '5%', 0.05, 'Stawka obniżona VAT 5%'),
  ('0', '0%', 0.00, 'Stawka 0% VAT'),
  ('zw', 'Zwolnione', 0.00, 'Zwolnione z VAT'),
  ('np', 'Nie podlega', 0.00, 'Nie podlega VAT')
on conflict (code) do nothing;

-- UNITS TABLE - Jednostki miary zgodne z KSeF
create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint units_code_not_blank check (btrim(code) <> ''),
  constraint units_name_not_blank check (btrim(name) <> '')
);

-- RLS for units - PUBLIC READ-ONLY
alter table public.units enable row level security;
create policy units_select on public.units for select using (true);

-- Insert common Polish/KSeF units
insert into public.units (code, name, description) values
  ('szt', 'sztuka', 'Jednostka podstawowa - sztuka'),
  ('kg', 'kilogram', 'Kilogram'),
  ('g', 'gram', 'Gram'),
  ('t', 'tona', 'Tona metryczna'),
  ('l', 'litr', 'Litr'),
  ('ml', 'mililitr', 'Mililitr'),
  ('m', 'metr', 'Metr'),
  ('cm', 'centymetr', 'Centymetr'),
  ('mm', 'milimetr', 'Milimetr'),
  ('m2', 'metr kwadratowy', 'Metr kwadratowy'),
  ('m3', 'metr sześcienny', 'Metr sześcienny'),
  ('godz', 'godzina', 'Godzina'),
  ('min', 'minuta', 'Minuta'),
  ('dzień', 'dzień', 'Dzień'),
  ('tydzień', 'tydzień', 'Tydzień'),
  ('miesiąc', 'miesiąc', 'Miesiąc'),
  ('usł', 'usługa', 'Usługa'),
  ('komplet', 'komplet', 'Komplet'),
  ('opak', 'opakowanie', 'Opakowanie'),
  ('para', 'para', 'Para'),
  ('zest', 'zestaw', 'Zestaw')
on conflict (code) do nothing;

-- CURRENCIES TABLE - Waluty ISO 4217
create table if not exists public.currencies (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  symbol text,
  decimal_places integer not null default 2,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint currencies_code_len check (char_length(code) = 3),
  constraint currencies_name_not_blank check (btrim(name) <> ''),
  constraint currencies_decimal_places_valid check (decimal_places >= 0 and decimal_places <= 4)
);

-- RLS for currencies - PUBLIC READ-ONLY
alter table public.currencies enable row level security;
create policy currencies_select on public.currencies for select using (true);

-- Insert common currencies
insert into public.currencies (code, name, symbol, decimal_places) values
  ('PLN', 'Polski złoty', 'zł', 2),
  ('EUR', 'Euro', '€', 2),
  ('USD', 'Dolar amerykański', '$', 2),
  ('GBP', 'Funt brytyjski', '£', 2),
  ('CZK', 'Korona czeska', 'Kč', 2),
  ('CHF', 'Frank szwajcarski', 'CHF', 2),
  ('NOK', 'Korona norweska', 'kr', 2),
  ('SEK', 'Korona szwedzka', 'kr', 2),
  ('DKK', 'Korona duńska', 'kr', 2),
  ('HUF', 'Forint węgierski', 'Ft', 2),
  ('UAH', 'Hrywna ukraińska', '₴', 2),
  ('CAD', 'Dolar kanadyjski', 'CA$', 2),
  ('AUD', 'Dolar australijski', 'A$', 2),
  ('JPY', 'Jen japoński', '¥', 0)
on conflict (code) do nothing;

-- COUNTRIES TABLE - Kraje ISO 3166-1
create table if not exists public.countries (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  name_en text not null,
  eu_member boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint countries_code_len check (char_length(code) = 2),
  constraint countries_name_not_blank check (btrim(name) <> ''),
  constraint countries_name_en_not_blank check (btrim(name_en) <> '')
);

-- RLS for countries - PUBLIC READ-ONLY
alter table public.countries enable row level security;
create policy countries_select on public.countries for select using (true);

-- Insert European countries (focus on EU and neighbors)
insert into public.countries (code, name, name_en, eu_member) values
  ('PL', 'Polska', 'Poland', true),
  ('DE', 'Niemcy', 'Germany', true),
  ('FR', 'Francja', 'France', true),
  ('IT', 'Włochy', 'Italy', true),
  ('ES', 'Hiszpania', 'Spain', true),
  ('CZ', 'Czechy', 'Czech Republic', true),
  ('SK', 'Słowacja', 'Slovakia', true),
  ('HU', 'Węgry', 'Hungary', true),
  ('AT', 'Austria', 'Austria', true),
  ('BE', 'Belgia', 'Belgium', true),
  ('NL', 'Holandia', 'Netherlands', true),
  ('DK', 'Dania', 'Denmark', true),
  ('SE', 'Szwecja', 'Sweden', true),
  ('FI', 'Finlandia', 'Finland', true),
  ('NO', 'Norwegia', 'Norway', false),
  ('CH', 'Szwajcaria', 'Switzerland', false),
  ('GB', 'Wielka Brytania', 'United Kingdom', false),
  ('IE', 'Irlandia', 'Ireland', true),
  ('PT', 'Portugalia', 'Portugal', true),
  ('GR', 'Grecja', 'Greece', true),
  ('HR', 'Chorwacja', 'Croatia', true),
  ('SI', 'Słowenia', 'Slovenia', true),
  ('LT', 'Litwa', 'Lithuania', true),
  ('LV', 'Łotwa', 'Latvia', true),
  ('EE', 'Estonia', 'Estonia', true),
  ('RO', 'Rumunia', 'Romania', true),
  ('BG', 'Bułgaria', 'Bulgaria', true),
  ('UA', 'Ukraina', 'Ukraine', false),
  ('BY', 'Białoruś', 'Belarus', false),
  ('RU', 'Rosja', 'Russia', false),
  ('US', 'Stany Zjednoczone', 'United States', false),
  ('CA', 'Kanada', 'Canada', false),
  ('CN', 'Chiny', 'China', false),
  ('JP', 'Japonia', 'Japan', false),
  ('AU', 'Australia', 'Austral.ia', false)
on conflict (code) do nothing;

-- REPORT_HISTORY TABLE - Historia generowanych raportów
create table if not exists public.report_history (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  report_type text not null,
  file_url text not null,
  meta jsonb,
  constraint report_history_type_not_blank check (btrim(report_type) <> '')
);

alter table public.report_history enable row level security;
-- RLS: Polityki bezpieczeństwa dla report_history (tylko właściciel ma dostęp)
create policy report_history_select on public.report_history for select using (owner_id = auth.uid());
create policy report_history_insert on public.report_history for insert with check (owner_id = auth.uid());
create policy report_history_update on public.report_history for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy report_history_delete on public.report_history for delete using (owner_id = auth.uid());

-- DONE! Your Fakturalis database is ready! 🎉