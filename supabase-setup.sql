-- Supabase Setup SQL
-- Run this in your Supabase SQL Editor

-- 1. Create storage bucket for signatures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('signatures', 'signatures', true, 5242880, ARRAY['image/png', 'image/jpeg'])
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
DROP POLICY IF EXISTS "Allow public access to signatures" ON storage.objects;
CREATE POLICY "Allow public access to signatures"
ON storage.objects FOR SELECT
USING (bucket_id = 'signatures');

DROP POLICY IF EXISTS "Allow authenticated users to upload signatures" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload signatures"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'signatures' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to update signatures" ON storage.objects;
CREATE POLICY "Allow authenticated users to update signatures"
ON storage.objects FOR UPDATE
USING (bucket_id = 'signatures' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to delete signatures" ON storage.objects;
CREATE POLICY "Allow authenticated users to delete signatures"
ON storage.objects FOR DELETE
USING (bucket_id = 'signatures' AND auth.role() = 'authenticated');

-- 2. Create users table with roles (use UUID to match auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'FSE' CHECK (role IN ('ADMIN', 'ASM', 'FSE')),
  branch TEXT,
  zone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users policies
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON public.users;
CREATE POLICY "Allow read access to authenticated users"
ON public.users FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow admin full access" ON public.users;
CREATE POLICY "Allow admin full access"
ON public.users FOR ALL
USING (
  auth.role() = 'authenticated' AND 
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'ADMIN'
);

DROP POLICY IF EXISTS "Allow ASM read access" ON public.users;
CREATE POLICY "Allow ASM read access"
ON public.users FOR SELECT
USING (
  auth.role() = 'authenticated' AND 
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('ADMIN', 'ASM')
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users policies (using TEXT id for simplicity)
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON public.users;
CREATE POLICY "Allow read access to authenticated users"
ON public.users FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow admin full access" ON public.users;
CREATE POLICY "Allow admin full access"
ON public.users FOR ALL
USING (
  auth.role() = 'authenticated' AND 
  EXISTS (SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role = 'ADMIN')
);

DROP POLICY IF EXISTS "Allow ASM read access" ON public.users;
CREATE POLICY "Allow ASM read access"
ON public.users FOR SELECT
USING (
  auth.role() = 'authenticated' AND 
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id::text = auth.uid()::text AND u.role IN ('ADMIN', 'ASM')
  )
);

-- 3. Create retailers table
CREATE TABLE IF NOT EXISTS public.retailers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  created_by UUID NOT NULL,
  created_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.retailers ENABLE ROW LEVEL SECURITY;

-- Retailers policies
DROP POLICY IF EXISTS "Allow read access to retailers" ON public.retailers;
CREATE POLICY "Allow read access to retailers"
ON public.retailers FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow insert access to retailers" ON public.retailers;
CREATE POLICY "Allow insert access to retailers"
ON public.retailers FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow update access to retailers" ON public.retailers;
CREATE POLICY "Allow update access to retailers"
ON public.retailers FOR UPDATE
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow delete access to retailers" ON public.retailers;
CREATE POLICY "Allow delete access to retailers"
ON public.retailers FOR DELETE
USING (
  auth.role() = 'authenticated' AND 
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'ADMIN'
);

-- 4. Create contracts table
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id UUID NOT NULL,
  retailer_name TEXT NOT NULL,
  contract_number TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SIGNED', 'SENT')),
  retailer_signature TEXT,
  staff_signature TEXT,
  contract_date DATE NOT NULL,
  created_by UUID NOT NULL,
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
DROP POLICY IF EXISTS "Allow read access to contracts" ON public.contracts;
CREATE POLICY "Allow read access to contracts"
ON public.contracts FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow insert access to contracts" ON public.contracts;
CREATE POLICY "Allow insert access to contracts"
ON public.contracts FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow update access to contracts" ON public.contracts;
CREATE POLICY "Allow update access to contracts"
ON public.contracts FOR UPDATE
USING (auth.role() = 'authenticated');

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

-- 6. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.contracts;

-- =============================================
-- DUMMY DATA FOR TESTING
-- =============================================

-- Insert test users (use actual auth UID or mock IDs)
INSERT INTO public.users (id, email, full_name, role, branch, zone, is_active) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin@lmit.com', 'Marco Rossi', 'ADMIN', NULL, NULL, true),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'asm.milan@lmit.com', 'Giulia Bianchi', 'ASM', 'LMIT-HS-MILAN', NULL, true),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'asm.rome@lmit.com', 'Luca Ferraro', 'ASM', 'LMIT-HS-ROME', NULL, true),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'fse.milan1@lmit.com', 'Sofia Conti', 'FSE', 'LMIT-HS-MILAN', 'HS MILANO ZONE 1', true),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'fse.milan2@lmit.com', 'Alessandro Ricci', 'FSE', 'LMIT-HS-MILAN', 'HS MILANO ZONE 2', true),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'fse.rome1@lmit.com', 'Valentina Leone', 'FSE', 'LMIT-HS-ROME', 'HS ROMA ZONE 1', true)
ON CONFLICT (id) DO NOTHING;

-- Insert test retailers
INSERT INTO public.retailers (id, company_name, vat_number, address_lane, house_number, city, postcode, contact_person_name, contact_person_surname, mobile_number, landline_number, email, branch, zone, created_by, created_by_name, created_at) VALUES
('11000000-0000-0000-0000-000000000001', 'Elettronica Milano SRL', 'IT12345678901', 'Via Torino', '45', 'Milano', '20123', 'Roberto', 'Mancini', '+39 345 678 9012', '+39 02 1234567', 'roberto@elettronica-milano.it', 'LMIT-HS-MILAN', 'HS MILANO ZONE 1', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Sofia Conti', '2024-02-01T10:00:00Z'),
('11000000-0000-0000-0000-000000000002', 'Tech Roma SPA', 'IT98765432109', 'Via del Corso', '120', 'Roma', '00186', 'Francesca', 'Moretti', '+39 348 123 4567', '+39 06 9876543', 'francesca@techroma.it', 'LMIT-HS-ROME', 'HS ROMA ZONE 1', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'Valentina Leone', '2024-02-03T11:00:00Z'),
('11000000-0000-0000-0000-000000000003', 'Digital Store Napoli', 'IT55566677788', 'Via Toledo', '234', 'Napoli', '80134', 'Antonio', 'Esposito', '+39 333 999 8877', '+39 081 5556677', 'antonio@digitalstore.it', 'LMIT-HS-NAPLES', 'HS NAPOLI ZONE 2', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Marco Rossi', '2024-02-05T09:00:00Z'),
('11000000-0000-0000-0000-000000000004', 'Bari Electronics SRL', 'IT44455566677', 'Via Sparano', '78', 'Bari', '70121', 'Giuseppe', 'Russo', '+39 320 111 2233', '+39 080 3334455', 'giuseppe@barielectronics.it', 'LMIT-HS-BARI', 'HS BARI ZONE 1', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Marco Rossi', '2024-02-07T14:00:00Z'),
('11000000-0000-0000-0000-000000000005', 'Padova Smart Tech', 'IT33344455566', 'Via Roma', '55', 'Padova', '35122', 'Chiara', 'Fontana', '+39 347 222 3344', '+39 049 7778899', 'chiara@padovasmart.it', 'LMIT-HS-PADOVA', 'HS PADOVA ZONE 1', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Marco Rossi', '2024-02-10T08:00:00Z'),
('11000000-0000-0000-0000-000000000006', 'Milano Centro Retail', 'IT22233344455', 'Corso Buenos Aires', '33', 'Milano', '20124', 'Marco', 'Villa', '+39 349 333 4455', '+39 02 8889900', 'marco@milanopretail.it', 'LMIT-HS-MILAN', 'HS MILANO ZONE 2', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'Alessandro Ricci', '2024-02-12T16:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Insert test contracts
INSERT INTO public.contracts (id, retailer_id, retailer_name, contract_number, status, retailer_signature, contract_date, created_by, created_by_name, branch, zone, created_at) VALUES
('c1000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 'Elettronica Milano SRL', 'LMIT-2024-0001', 'SIGNED', 'data:image/png;base64,iVBORw0KGgo=', '2024-02-01', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Sofia Conti', 'LMIT-HS-MILAN', 'HS MILANO ZONE 1', '2024-02-01T10:30:00Z'),
('c1000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000002', 'Tech Roma SPA', 'LMIT-2024-0002', 'SENT', 'data:image/png;base64,iVBORw0KGgo=', '2024-02-03', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'Valentina Leone', 'LMIT-HS-ROME', 'HS ROMA ZONE 1', '2024-02-03T11:30:00Z'),
('c1000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000003', 'Digital Store Napoli', 'LMIT-2024-0003', 'PENDING', NULL, '2024-02-05', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Marco Rossi', 'LMIT-HS-NAPLES', 'HS NAPOLI ZONE 2', '2024-02-05T09:30:00Z'),
('c1000000-0000-0000-0000-000000000004', '11000000-0000-0000-0000-000000000004', 'Bari Electronics SRL', 'LMIT-2024-0004', 'PENDING', NULL, '2024-02-07', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Marco Rossi', 'LMIT-HS-BARI', 'HS BARI ZONE 1', '2024-02-07T14:30:00Z'),
('c1000000-0000-0000-0000-000000000005', '11000000-0000-0000-0000-000000000006', 'Milano Centro Retail', 'LMIT-2024-0005', 'SIGNED', 'data:image/png;base64,iVBORw0KGgo=', '2024-02-12', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'Alessandro Ricci', 'LMIT-HS-MILAN', 'HS MILANO ZONE 2', '2024-02-12T16:30:00Z')
ON CONFLICT (id) DO NOTHING;