-- Phase 4: Wage calculator support

-- Add hourly_rate to Users Info for all wage-bearing roles
ALTER TABLE "Users Info" ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10,2) DEFAULT NULL;

-- Index for quickly finding users with wage rates
CREATE INDEX IF NOT EXISTS idx_users_info_hourly_rate ON "Users Info"(hourly_rate) WHERE hourly_rate IS NOT NULL;
