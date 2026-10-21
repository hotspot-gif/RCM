-- =============================================================
-- Per-user finalization permissions.
-- Admins control which signing options a staff member may use:
--   can_download_draft     -> download the unsigned draft (sign offline)
--   can_use_remote_link    -> email a remote signing link to the retailer
--   can_capture_signature  -> capture signatures on this device
-- Run this in your Supabase SQL editor.
-- =============================================================

alter table public.users
  add column if not exists can_capture_signature boolean not null default true;

alter table public.users
  add column if not exists can_use_remote_link boolean not null default true;

alter table public.users
  add column if not exists can_download_draft boolean not null default true;
