-- Supabase Setup SQL
-- Run this in your Supabase SQL Editor

-- 1. Create storage bucket for signatures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('signatures', 'signatures', true, 5242880, ARRAY['image/png', 'image/jpeg'])
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Allow public access to signatures"
ON storage.objects FOR SELECT
USING (bucket_id = 'signatures');

CREATE POLICY "Allow authenticated users to upload signatures"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'signatures' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update signatures"
ON storage.objects FOR UPDATE
USING (bucket_id = 'signatures' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete signatures"
ON storage.objects FOR DELETE
USING (bucket_id = 'signatures' AND auth.role() = 'authenticated');

-- 2. Create contracts table
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id TEXT NOT NULL,
  retailer_name TEXT NOT NULL,
  contract_number TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SIGNED', 'SENT')),
  retailer_signature TEXT,
  staff_signature TEXT,
  contract_date DATE NOT NULL,
  created_by TEXT NOT NULL,
  created_by_name TEXT,
  branch TEXT NOT NULL,
  zone TEXT NOT NULL,
  pdf_url TEXT,
  retailer_email TEXT,
  staff_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Contracts policies
CREATE POLICY "Allow read access to authenticated users"
ON public.contracts FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert access to authenticated users"
ON public.contracts FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update access to authenticated users"
ON public.contracts FOR UPDATE
USING (auth.role() = 'authenticated');

-- 3. Create retailers table
CREATE TABLE IF NOT EXISTS public.retailers (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  vat_number TEXT NOT NULL,
  address_lane TEXT NOT NULL,
  house_number TEXT NOT NULL,
  city TEXT NOT NULL,
  postcode TEXT NOT NULL,
  contact_person_name TEXT NOT NULL,
  contact_person_surname TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  landline_number TEXT,
  email TEXT NOT NULL,
  branch TEXT NOT NULL,
  zone TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.retailers ENABLE ROW LEVEL SECURITY;

-- Retailers policies
CREATE POLICY "Allow read access to authenticated users"
ON public.retailers FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert access to authenticated users"
ON public.retailers FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update access to authenticated users"
ON public.retailers FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow delete access to authenticated users"
ON public.retailers FOR DELETE
USING (auth.role() = 'authenticated');

-- 4. Create function to handle new contract webhook (for email)
-- This is a placeholder - you'll need to set up Resend or another email service
-- For now, we'll store the email data and you can process it via edge function

-- 5. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for contracts
DROP TRIGGER IF EXISTS update_contracts_updated_at ON public.contracts;
CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 6. Enable Realtime for contracts (optional - for live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.contracts;