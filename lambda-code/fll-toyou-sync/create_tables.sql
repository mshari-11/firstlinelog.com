-- ToYou Odoo Sync Tables
-- Run this in Supabase SQL Editor

-- Orders pulled from ToYou's Odoo
CREATE TABLE IF NOT EXISTS toyou_orders (
    id BIGSERIAL PRIMARY KEY,
    platform TEXT DEFAULT 'toyou',
    external_id TEXT UNIQUE NOT NULL,
    order_ref TEXT,
    customer_name TEXT,
    amount NUMERIC(12,2) DEFAULT 0,
    amount_untaxed NUMERIC(12,2) DEFAULT 0,
    tax_amount NUMERIC(12,2) DEFAULT 0,
    status TEXT DEFAULT 'new',
    odoo_state TEXT,
    order_date TIMESTAMPTZ,
    notes TEXT,
    source TEXT DEFAULT 'odoo_xmlrpc',
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_toyou_orders_date ON toyou_orders(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_toyou_orders_status ON toyou_orders(status);

-- Partners (drivers/contacts) from ToYou's Odoo
CREATE TABLE IF NOT EXISTS toyou_partners (
    id BIGSERIAL PRIMARY KEY,
    platform TEXT DEFAULT 'toyou',
    external_id TEXT UNIQUE NOT NULL,
    name TEXT,
    email TEXT,
    phone TEXT,
    city TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    source TEXT DEFAULT 'odoo_xmlrpc',
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_toyou_partners_name ON toyou_partners(name);

-- Vehicles from ToYou's Odoo fleet module
CREATE TABLE IF NOT EXISTS toyou_vehicles (
    id BIGSERIAL PRIMARY KEY,
    platform TEXT DEFAULT 'toyou',
    external_id TEXT UNIQUE NOT NULL,
    name TEXT,
    plate TEXT,
    model TEXT,
    driver_name TEXT,
    odometer NUMERIC(12,1) DEFAULT 0,
    fuel_type TEXT,
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sync logs
CREATE TABLE IF NOT EXISTS sync_logs (
    id BIGSERIAL PRIMARY KEY,
    sync_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    results JSONB,
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_type ON sync_logs(sync_type, synced_at DESC);

-- Enable RLS
ALTER TABLE toyou_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE toyou_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE toyou_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "service_role_all" ON toyou_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON toyou_partners FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON toyou_vehicles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON sync_logs FOR ALL USING (true) WITH CHECK (true);
