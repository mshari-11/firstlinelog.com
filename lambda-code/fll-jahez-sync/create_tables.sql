-- Jahez/Saned Sync Tables

-- Drivers pulled from Jahez Saned portal
CREATE TABLE IF NOT EXISTS jahez_drivers (
    id BIGSERIAL PRIMARY KEY,
    platform TEXT DEFAULT 'jahez',
    external_id TEXT UNIQUE NOT NULL,
    iqama_number TEXT,
    name TEXT,
    phone TEXT,
    status TEXT,
    availability TEXT,
    vehicle_type TEXT,
    city TEXT,
    data JSONB,
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jahez_drivers_status ON jahez_drivers(status);
CREATE INDEX IF NOT EXISTS idx_jahez_drivers_name ON jahez_drivers(name);

-- Generic sync data store (profile, stats, lookups)
CREATE TABLE IF NOT EXISTS jahez_sync_data (
    id BIGSERIAL PRIMARY KEY,
    data_type TEXT NOT NULL,
    external_id TEXT NOT NULL,
    data JSONB,
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(data_type, external_id)
);

-- RLS
ALTER TABLE jahez_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE jahez_sync_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON jahez_drivers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON jahez_sync_data FOR ALL USING (true) WITH CHECK (true);
