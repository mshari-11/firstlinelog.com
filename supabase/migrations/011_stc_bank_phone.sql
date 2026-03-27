-- ============================================================================
-- Add STC Bank Phone to driver applications and driver payouts
-- Format: 9 digits starting with 5 (local), stored as 966XXXXXXXXX (international)
-- ============================================================================

-- Add to driver_applications (registration form)
ALTER TABLE IF EXISTS driver_applications
  ADD COLUMN IF NOT EXISTS stc_bank_phone_local VARCHAR(9),
  ADD COLUMN IF NOT EXISTS stc_bank_phone_int VARCHAR(12)
    GENERATED ALWAYS AS ('966' || stc_bank_phone_local) STORED;

-- Add constraint: must be 9 digits starting with 5
ALTER TABLE IF EXISTS driver_applications
  ADD CONSTRAINT chk_stc_phone_format
    CHECK (stc_bank_phone_local IS NULL OR stc_bank_phone_local ~ '^5\d{8}$');

-- Add to couriers table (active drivers)
ALTER TABLE IF EXISTS couriers
  ADD COLUMN IF NOT EXISTS stc_bank_phone_local VARCHAR(9),
  ADD COLUMN IF NOT EXISTS stc_bank_phone_int VARCHAR(12)
    GENERATED ALWAYS AS ('966' || stc_bank_phone_local) STORED;

ALTER TABLE IF EXISTS couriers
  ADD CONSTRAINT chk_courier_stc_phone
    CHECK (stc_bank_phone_local IS NULL OR stc_bank_phone_local ~ '^5\d{8}$');

-- Add to master.drivers if schema exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'master' AND table_name = 'drivers') THEN
    ALTER TABLE master.drivers
      ADD COLUMN IF NOT EXISTS stc_bank_phone_local VARCHAR(9),
      ADD COLUMN IF NOT EXISTS stc_bank_phone_int VARCHAR(12)
        GENERATED ALWAYS AS ('966' || stc_bank_phone_local) STORED;
  END IF;
END $$;

-- Add to finance.driver_payouts for STC Bank Excel export
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'finance' AND table_name = 'driver_payouts') THEN
    ALTER TABLE finance.driver_payouts
      ADD COLUMN IF NOT EXISTS stc_bank_phone VARCHAR(12);
    COMMENT ON COLUMN finance.driver_payouts.stc_bank_phone IS 'International format 966XXXXXXXXX for STC Bank Excel export';
  END IF;
END $$;

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_driver_apps_stc_phone ON driver_applications(stc_bank_phone_local) WHERE stc_bank_phone_local IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_couriers_stc_phone ON couriers(stc_bank_phone_local) WHERE stc_bank_phone_local IS NOT NULL;

COMMENT ON COLUMN driver_applications.stc_bank_phone_local IS 'STC Bank phone — 9 digits starting with 5 (e.g. 563636006)';
COMMENT ON COLUMN driver_applications.stc_bank_phone_int IS 'Auto-generated international format (e.g. 966563636006) for STC Bank Excel';
