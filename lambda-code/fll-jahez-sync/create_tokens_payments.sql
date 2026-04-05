-- Token storage for n8n automation
CREATE TABLE IF NOT EXISTS platform_tokens (
  id BIGSERIAL PRIMARY KEY,
  platform TEXT UNIQUE NOT NULL,
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE platform_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_all" ON platform_tokens FOR ALL USING (true) WITH CHECK (true);

-- RPC: get Saned token
CREATE OR REPLACE FUNCTION get_saned_token()
RETURNS TEXT LANGUAGE sql SECURITY DEFINER AS $$
  SELECT token FROM platform_tokens WHERE platform = 'saned' AND (expires_at IS NULL OR expires_at > NOW()) LIMIT 1;
$$;

-- RPC: save Saned token
CREATE OR REPLACE FUNCTION save_saned_token(p_token TEXT, p_expires_at TIMESTAMPTZ DEFAULT NULL)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  INSERT INTO platform_tokens (platform, token, expires_at, updated_at)
  VALUES ('saned', p_token, p_expires_at, NOW())
  ON CONFLICT (platform) DO UPDATE SET token = p_token, expires_at = p_expires_at, updated_at = NOW();
$$;

-- Jahez financial data
CREATE TABLE IF NOT EXISTS jahez_payments (
  id BIGSERIAL PRIMARY KEY,
  external_id TEXT UNIQUE,
  driver_id TEXT,
  driver_name TEXT,
  amount NUMERIC(12,2) DEFAULT 0,
  payment_type TEXT,
  status TEXT,
  payment_date TIMESTAMPTZ,
  data JSONB,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE jahez_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_all" ON jahez_payments FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_jahez_payments_driver ON jahez_payments(driver_id);
