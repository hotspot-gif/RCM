-- =============================================================
-- Create storage buckets for signatures and generated PDFs.
-- These are private buckets; files are served via signed URLs.
-- =============================================================

insert into storage.buckets (id, name, public)
values ('signatures', 'signatures', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('contracts', 'contracts', false)
on conflict (id) do nothing;

-- Allow authenticated users to upload and read their own files.
drop policy if exists "signatures_auth_rw" on storage.objects;
create policy "signatures_auth_rw" on storage.objects
  for all using (
    bucket_id = 'signatures' and auth.role() = 'authenticated'
  ) with check (
    bucket_id = 'signatures' and auth.role() = 'authenticated'
  );

drop policy if exists "contracts_auth_rw" on storage.objects;
create policy "contracts_auth_rw" on storage.objects
  for all using (
    bucket_id = 'contracts' and auth.role() = 'authenticated'
  ) with check (
    bucket_id = 'contracts' and auth.role() = 'authenticated'
  );
