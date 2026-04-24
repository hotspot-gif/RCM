-- =============================================================
-- FIX: Infinite RLS recursion on public.users + auto-provision
-- profile row from auth signup.
--
-- Run this in the Supabase SQL editor.  Safe to run multiple times.
-- =============================================================

-- ---- 1. Drop the recursive policies ----------------------------
drop policy if exists "users_self_select"     on public.users;
drop policy if exists "users_admin_select"    on public.users;
drop policy if exists "users_admin_write"     on public.users;
drop policy if exists "contracts_scoped_select" on public.contracts;
drop policy if exists "contracts_update"      on public.contracts;
drop policy if exists "contracts_delete_admin" on public.contracts;

-- ---- 2. SECURITY DEFINER helper functions ----------------------
-- They bypass RLS so referencing public.users from a policy no
-- longer triggers recursion.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'ADMIN'
  );
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid() limit 1;
$$;

create or replace function public.current_user_branch()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select branch from public.users where id = auth.uid() limit 1;
$$;

create or replace function public.current_user_zone()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select zone from public.users where id = auth.uid() limit 1;
$$;

grant execute on function public.is_admin()            to authenticated;
grant execute on function public.current_user_role()   to authenticated;
grant execute on function public.current_user_branch() to authenticated;
grant execute on function public.current_user_zone()   to authenticated;

-- ---- 3. Recreate policies without recursion --------------------
-- users: every signed-in user can read their own row; admins read all.
create policy "users_self_select" on public.users for select
  using (auth.uid() = id);

create policy "users_admin_select" on public.users for select
  using (public.is_admin());

create policy "users_admin_write" on public.users for all
  using (public.is_admin())
  with check (public.is_admin());

-- contracts: admin all, ASM by branch, FSE by zone
create policy "contracts_scoped_select" on public.contracts for select using (
  public.is_admin()
  or (public.current_user_role() = 'ASM' and public.current_user_branch() = contracts.branch)
  or (public.current_user_role() = 'FSE' and public.current_user_zone()   = contracts.zone)
);

create policy "contracts_update" on public.contracts for update using (
  public.is_admin()
  or (public.current_user_role() = 'ASM' and public.current_user_branch() = contracts.branch)
  or (public.current_user_role() = 'FSE' and public.current_user_zone()   = contracts.zone)
);

create policy "contracts_delete_admin" on public.contracts for delete
  using (public.is_admin());

-- ---- 4. Auto-provision a public.users row on auth signup -------
-- First user ever becomes ADMIN; subsequent users default to FSE
-- and can be promoted by the admin from the Users screen.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  if not exists (select 1 from public.users) then
    v_role := 'ADMIN';
  else
    v_role := 'FSE';
  end if;

  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    v_role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ---- 5. Backfill profiles for already-signed-up auth users -----
insert into public.users (id, email, full_name, role)
select
  au.id,
  au.email,
  coalesce(au.raw_user_meta_data ->> 'full_name', au.email),
  'FSE'
from auth.users au
where not exists (select 1 from public.users u where u.id = au.id);

-- If no admin exists yet, promote the oldest auth user.
update public.users
set role = 'ADMIN'
where id = (
  select u.id
  from public.users u
  join auth.users au on au.id = u.id
  order by au.created_at asc
  limit 1
)
and not exists (select 1 from public.users where role = 'ADMIN');
