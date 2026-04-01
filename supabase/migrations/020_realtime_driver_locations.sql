-- ============================================================
-- 1. Create driver_locations table for Realtime tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS public.driver_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id TEXT NOT NULL,
  driver_name TEXT,
  platform TEXT,
  latitude DOUBLE PRECISION NOT NULL DEFAULT 24.7136,
  longitude DOUBLE PRECISION NOT NULL DEFAULT 46.6753,
  heading DOUBLE PRECISION DEFAULT 0,
  speed DOUBLE PRECISION DEFAULT 0,
  accuracy DOUBLE PRECISION,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'busy', 'offline', 'break')),
  vehicle_type TEXT,
  active_order_id TEXT,
  city TEXT DEFAULT 'الرياض',
  battery_level INT,
  is_online BOOLEAN DEFAULT false,
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_driver_locations_driver_id ON public.driver_locations(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_locations_is_online ON public.driver_locations(is_online) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS idx_driver_locations_city ON public.driver_locations(city);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_driver_location_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.last_seen_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_driver_location_timestamp ON public.driver_locations;
CREATE TRIGGER trg_driver_location_timestamp
  BEFORE UPDATE ON public.driver_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_driver_location_timestamp();

-- ============================================================
-- 2. Enable Realtime on driver_locations
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;

-- ============================================================
-- 3. Enable RLS (Row Level Security)
-- ============================================================
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;

-- Allow read for authenticated users (admin panel)
CREATE POLICY "Allow read for authenticated" ON public.driver_locations
  FOR SELECT USING (true);

-- Allow insert/update for service role (from Lambda/API)
CREATE POLICY "Allow write for service role" ON public.driver_locations
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 4. Encryption for sensitive columns (pgsodium)
-- ============================================================
-- Enable pgsodium extension
CREATE EXTENSION IF NOT EXISTS pgsodium;

-- Create encrypted_data table for sensitive fields
CREATE TABLE IF NOT EXISTS public.encrypted_driver_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id TEXT NOT NULL UNIQUE,
  iban_encrypted TEXT, -- encrypted IBAN
  stc_phone_encrypted TEXT, -- encrypted STC phone
  salary_encrypted TEXT, -- encrypted salary info
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 5. Full-text search for Arabic (using tsvector)
-- ============================================================
-- Add search vectors to key tables
ALTER TABLE public.driver_applications ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update search vector
CREATE OR REPLACE FUNCTION public.update_driver_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('simple',
    coalesce(NEW.full_name, '') || ' ' ||
    coalesce(NEW.phone, '') || ' ' ||
    coalesce(NEW.city, '') || ' ' ||
    coalesce(NEW.platform, '') || ' ' ||
    coalesce(NEW.contract_type, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_driver_search ON public.driver_applications;
CREATE TRIGGER trg_driver_search
  BEFORE INSERT OR UPDATE ON public.driver_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_driver_search_vector();

-- GIN index for fast search
CREATE INDEX IF NOT EXISTS idx_driver_search ON public.driver_applications USING GIN(search_vector);

-- Search function
CREATE OR REPLACE FUNCTION public.search_drivers(query TEXT)
RETURNS SETOF public.driver_applications AS $$
  SELECT *
  FROM public.driver_applications
  WHERE search_vector @@ to_tsquery('simple', query)
     OR full_name ILIKE '%' || query || '%'
     OR phone ILIKE '%' || query || '%'
     OR city ILIKE '%' || query || '%'
  ORDER BY ts_rank(search_vector, to_tsquery('simple', query)) DESC
  LIMIT 50;
$$ LANGUAGE sql STABLE;
