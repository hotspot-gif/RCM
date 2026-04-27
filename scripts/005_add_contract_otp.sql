alter table public.contracts
  add column if not exists otp_hash text,
  add column if not exists otp_salt text,
  add column if not exists otp_sent_at timestamptz,
  add column if not exists otp_expires_at timestamptz,
  add column if not exists otp_verified_at timestamptz,
  add column if not exists otp_attempts integer not null default 0;

