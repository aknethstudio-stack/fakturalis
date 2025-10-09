-- KSeF (Krajowy System e-Faktur) Extensions for Fakturalis
-- Rozszerzenia bazy danych dla integracji z Polskim Krajowym System e-Faktur
-- @language postgresql

-- KSeF submission status enum
do $$
begin
  if not exists (select 1 from pg_type where typname = 'ksef_submission_status') then
    create type public.ksef_submission_status as enum ('not_sent','pending','accepted','rejected','error');
  end if;
end
$$;

-- Add KSeF fields to existing invoices table
alter table public.invoices 
  add column if not exists ksef_id uuid,
  add column if not exists ksef_status public.ksef_submission_status default 'not_sent',
  add column if not exists ksef_reference_number text,
  add column if not exists ksef_submission_id text,
  add column if not exists ksef_submitted_at timestamptz,
  add column if not exists ksef_upo_number text,
  add column if not exists ksef_processing_code text;

-- KSeF submissions tracking table
create table if not exists public.ksef_submissions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  submission_id text not null,
  reference_number text,
  status public.ksef_submission_status not null default 'pending',
  xml_content text, -- Original FA_VAT XML content
  xml_hash text, -- SHA-256 hash of XML content
  response_data jsonb, -- Full API response from KSeF
  error_message text,
  error_code text,
  processing_code text,
  processing_description text,
  upo_number text,
  upo_content text, -- Base64 encoded UPO XML
  acquisition_timestamp timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ksef_submissions_submission_id_not_blank check (btrim(submission_id) <> '')
);

create trigger ksef_submissions_set_updated_at before update on public.ksef_submissions
for each row execute function public.set_updated_at();

-- KSeF session tokens cache table
create table if not exists public.ksef_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  session_id text not null,
  session_token text not null,
  expires_at timestamptz not null,
  environment text not null default 'demo' check (environment in ('demo', 'production')),
  created_at timestamptz not null default now(),
  constraint ksef_sessions_unique_owner_env unique (owner_id, environment)
);

-- KSeF configuration/certificates table for production use
create table if not exists public.ksef_config (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  environment text not null default 'demo' check (environment in ('demo', 'production')),
  certificate_content text, -- Base64 encoded certificate for production
  certificate_password text, -- Encrypted certificate password
  identifier text, -- KSeF identifier/NIP
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ksef_config_unique_owner_env unique (owner_id, environment)
);

create trigger ksef_config_set_updated_at before update on public.ksef_config
for each row execute function public.set_updated_at();

-- Indexes for KSeF tables
create index if not exists ksef_submissions_owner_invoice_idx on public.ksef_submissions(owner_id, invoice_id);
create index if not exists ksef_submissions_status_idx on public.ksef_submissions(status);
create index if not exists ksef_submissions_reference_number_idx on public.ksef_submissions(reference_number);
create index if not exists ksef_sessions_owner_env_idx on public.ksef_sessions(owner_id, environment);
create index if not exists ksef_sessions_expires_idx on public.ksef_sessions(expires_at);
create index if not exists invoices_ksef_status_idx on public.invoices(owner_id, ksef_status);
create index if not exists invoices_ksef_reference_idx on public.invoices(ksef_reference_number);

-- ROW LEVEL SECURITY for KSeF tables
alter table public.ksef_submissions enable row level security;
alter table public.ksef_sessions enable row level security;
alter table public.ksef_config enable row level security;

-- RLS POLICIES - KSEF_SUBMISSIONS
create policy ksef_submissions_select on public.ksef_submissions for select using (owner_id = auth.uid());
create policy ksef_submissions_insert on public.ksef_submissions for insert with check (owner_id = auth.uid());
create policy ksef_submissions_update on public.ksef_submissions for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy ksef_submissions_delete on public.ksef_submissions for delete using (owner_id = auth.uid());

-- RLS POLICIES - KSEF_SESSIONS
create policy ksef_sessions_select on public.ksef_sessions for select using (owner_id = auth.uid());
create policy ksef_sessions_insert on public.ksef_sessions for insert with check (owner_id = auth.uid());
create policy ksef_sessions_update on public.ksef_sessions for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy ksef_sessions_delete on public.ksef_sessions for delete using (owner_id = auth.uid());

-- RLS POLICIES - KSEF_CONFIG
create policy ksef_config_select on public.ksef_config for select using (owner_id = auth.uid());
create policy ksef_config_insert on public.ksef_config for insert with check (owner_id = auth.uid());
create policy ksef_config_update on public.ksef_config for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy ksef_config_delete on public.ksef_config for delete using (owner_id = auth.uid());

-- CONVENIENCE DEFAULTS
alter table public.ksef_submissions alter column owner_id set default auth.uid();
alter table public.ksef_sessions alter column owner_id set default auth.uid();
alter table public.ksef_config alter column owner_id set default auth.uid();

-- Views for easier querying
create or replace view public.invoices_with_ksef as
select 
  i.*,
  ks.submission_id as latest_submission_id,
  ks.response_data as latest_response_data,
  ks.error_message as latest_error_message,
  ks.acquisition_timestamp as latest_acquisition_timestamp,
  ks.upo_number as latest_upo_number
from public.invoices i
left join public.ksef_submissions ks on ks.invoice_id = i.id
and ks.created_at = (
  select max(created_at) 
  from public.ksef_submissions ks2 
  where ks2.invoice_id = i.id
);

-- Grant access to view
grant select on public.invoices_with_ksef to authenticated;

-- Function to update invoice KSeF status based on latest submission
create or replace function public.update_invoice_ksef_status()
returns trigger as $$
begin
  update public.invoices 
  set 
    ksef_status = new.status,
    ksef_reference_number = new.reference_number,
    ksef_submission_id = new.submission_id,
    ksef_submitted_at = case when new.status != 'not_sent' then new.created_at else null end,
    ksef_upo_number = new.upo_number,
    ksef_processing_code = new.processing_code
  where id = new.invoice_id;
  
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-update invoice KSeF fields when submission status changes
create trigger ksef_submissions_update_invoice_status
after insert or update on public.ksef_submissions
for each row execute function public.update_invoice_ksef_status();

-- KSeF database extensions ready! 🇵🇱