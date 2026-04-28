-- =============================================================
-- Retailer Contract Management System - Initial Schema
-- Run this in your Supabase SQL editor before using the app.
-- =============================================================

-- USERS TABLE (profile per auth user)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null,
  role text not null check (role in ('ADMIN','RSM','ASM','FSE')),
  branch text,
  branches text[],
  zone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- BRANCHES (static list but stored for referential integrity)
create table if not exists public.branches (
  code text primary key,
  name text not null
);

-- ZONES
create table if not exists public.zones (
  code text primary key,
  branch_code text not null references public.branches(code) on delete cascade,
  name text not null
);

-- CONTRACTS
create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  -- retailer information
  company_name text not null,
  vat_number text not null,
  contact_first_name text not null,
  contact_last_name text not null,
  shop_name text not null,
  street text not null,
  house_number text not null,
  city text not null,
  post_code text not null,
  landline_number text,
  mobile_number text not null,
  email text not null,
  -- relationships
  branch text,
  zone text,
  created_by uuid references public.users(id) on delete set null,
  -- signatures stored as Supabase Storage paths
  retailer_signature_path text,
  staff_signature_path text,
  pdf_path text,
  -- status and audit
  status text not null default 'GENERATED' check (status in ('GENERATED','PENDING','SIGNED')),
  signed_at timestamptz,
  emailed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contracts_created_by_idx on public.contracts(created_by);
create index if not exists contracts_branch_idx on public.contracts(branch);
create index if not exists contracts_zone_idx on public.contracts(zone);
create index if not exists contracts_status_idx on public.contracts(status);

-- =============================================================
-- Seed branches & zones
-- =============================================================
insert into public.branches (code, name) values
  ('LMIT-HS-BARI','HS BARI'),
  ('LMIT-HS-BOLOGNA','HS BOLOGNA'),
  ('LMIT-HS-MILAN','HS MILAN'),
  ('LMIT-HS-NAPLES','HS NAPLES'),
  ('LMIT-HS-PADOVA','HS PADOVA'),
  ('LMIT-HS-PALERMO','HS PALERMO'),
  ('LMIT-HS-ROME','HS ROME'),
  ('LMIT-HS-TORINO','HS TORINO')
on conflict (code) do nothing;

insert into public.zones (code, branch_code, name) values
  ('HS-BARI-Z1','LMIT-HS-BARI','HS BARI ZONE 1'),
  ('HS-BARI-Z2','LMIT-HS-BARI','HS BARI ZONE 2'),
  ('HS-BARI-Z3','LMIT-HS-BARI','HS BARI ZONE 3'),
  ('HS-BOLOGNA-Z1','LMIT-HS-BOLOGNA','HS BOLOGNA ZONE 1'),
  ('HS-BOLOGNA-Z2','LMIT-HS-BOLOGNA','HS BOLOGNA ZONE 2'),
  ('HS-BOLOGNA-Z3','LMIT-HS-BOLOGNA','HS BOLOGNA ZONE 3'),
  ('HS-MILANO-Z1','LMIT-HS-MILAN','HS MILANO ZONE 1'),
  ('HS-MILANO-Z2','LMIT-HS-MILAN','HS MILANO ZONE 2'),
  ('HS-MILANO-Z3','LMIT-HS-MILAN','HS MILANO ZONE 3'),
  ('HS-MILANO-Z4','LMIT-HS-MILAN','HS MILANO ZONE 4'),
  ('HS-NAPOLI-Z1','LMIT-HS-NAPLES','HS NAPOLI ZONE 1'),
  ('HS-NAPOLI-Z2','LMIT-HS-NAPLES','HS NAPOLI ZONE 2'),
  ('HS-NAPOLI-Z3','LMIT-HS-NAPLES','HS NAPOLI ZONE 3'),
  ('HS-NAPOLI-Z4','LMIT-HS-NAPLES','HS NAPOLI ZONE 4'),
  ('HS-NAPOLI-Z5','LMIT-HS-NAPLES','HS NAPOLI ZONE 5'),
  ('HS-NAPOLI-Z6','LMIT-HS-NAPLES','HS NAPOLI ZONE 6'),
  ('HS-NAPOLI-Z7','LMIT-HS-NAPLES','HS NAPOLI ZONE 7'),
  ('HS-PADOVA-Z1','LMIT-HS-PADOVA','HS PADOVA ZONE 1'),
  ('HS-PADOVA-Z2','LMIT-HS-PADOVA','HS PADOVA ZONE 2'),
  ('HS-PALERMO-Z1','LMIT-HS-PALERMO','HS PALERMO ZONE 1'),
  ('HS-PALERMO-Z2','LMIT-HS-PALERMO','HS PALERMO ZONE 2'),
  ('HS-PALERMO-Z3','LMIT-HS-PALERMO','HS PALERMO ZONE 3'),
  ('HS-ROMA-Z1','LMIT-HS-ROME','HS ROMA ZONE 1'),
  ('HS-ROMA-Z2','LMIT-HS-ROME','HS ROMA ZONE 2'),
  ('HS-ROMA-Z3','LMIT-HS-ROME','HS ROMA ZONE 3'),
  ('HS-ROMA-Z4','LMIT-HS-ROME','HS ROMA ZONE 4'),
  ('HS-ROMA-Z5','LMIT-HS-ROME','HS ROMA ZONE 5'),
  ('HS-TORINO-Z1','LMIT-HS-TORINO','HS TORINOO ZONE 1'),
  ('HS-TORINO-Z2','LMIT-HS-TORINO','HS TORINOO ZONE 2'),
  ('HS-TORINO-Z3','LMIT-HS-TORINO','HS TORINOO ZONE 3')
on conflict (code) do nothing;

-- =============================================================
-- Row Level Security
-- =============================================================
alter table public.users enable row level security;
alter table public.contracts enable row level security;
alter table public.branches enable row level security;
alter table public.zones enable row level security;

-- Users can read their own row
drop policy if exists "users_self_select" on public.users;
create policy "users_self_select" on public.users for select
  using (auth.uid() = id);

-- Admins can read all users
drop policy if exists "users_admin_select" on public.users;
create policy "users_admin_select" on public.users for select
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'ADMIN'));

-- Admins can insert / update / delete any user
drop policy if exists "users_admin_write" on public.users;
create policy "users_admin_write" on public.users for all
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'ADMIN'))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'ADMIN'));

-- branches / zones readable by any authenticated user
drop policy if exists "branches_auth_select" on public.branches;
create policy "branches_auth_select" on public.branches for select using (auth.role() = 'authenticated');
drop policy if exists "zones_auth_select" on public.zones;
create policy "zones_auth_select" on public.zones for select using (auth.role() = 'authenticated');

-- Contracts: admin sees all, ASM sees by branch, FSE sees by zone + own
drop policy if exists "contracts_scoped_select" on public.contracts;
create policy "contracts_scoped_select" on public.contracts for select using (
  exists (
    select 1 from public.users u where u.id = auth.uid() and (
      u.role = 'ADMIN'
      or (u.role = 'RSM' and contracts.branch = any(coalesce(u.branches, array[]::text[])))
      or (u.role = 'ASM' and u.branch = contracts.branch)
      or (u.role = 'FSE' and u.zone = contracts.zone)
    )
  )
);

drop policy if exists "contracts_insert" on public.contracts;
create policy "contracts_insert" on public.contracts for insert with check (
  auth.uid() is not null
  and created_by = auth.uid()
  and exists (
    select 1 from public.users u where u.id = auth.uid() and (
      u.role = 'ADMIN'
      or (u.role = 'RSM' and contracts.branch = any(coalesce(u.branches, array[]::text[])))
      or (u.role = 'ASM' and u.branch = contracts.branch)
      or (u.role = 'FSE' and u.zone = contracts.zone)
    )
  )
);

drop policy if exists "contracts_update" on public.contracts;
create policy "contracts_update" on public.contracts for update using (
  exists (
    select 1 from public.users u where u.id = auth.uid() and (
      u.role = 'ADMIN'
      or (u.role = 'RSM' and contracts.branch = any(coalesce(u.branches, array[]::text[])))
      or (u.role = 'ASM' and u.branch = contracts.branch)
      or (u.role = 'FSE' and u.zone = contracts.zone)
    )
  )
);

drop policy if exists "contracts_delete_admin" on public.contracts;
create policy "contracts_delete_admin" on public.contracts for delete using (
  exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and (
        u.role = 'ADMIN'
        or (
          u.role = 'RSM'
          and contracts.branch = any(coalesce(u.branches, array[]::text[]))
        )
      )
  )
);
