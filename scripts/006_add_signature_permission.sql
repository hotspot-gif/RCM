-- =============================================================
-- Add per-user permission controlling whether a staff member may
-- capture a digital signature on-device during contract finalization.
-- When false, the user must download the draft PDF and sign offline.
-- Run this in your Supabase SQL editor.
-- =============================================================

alter table public.users
  add column if not exists can_capture_signature boolean not null default true;
