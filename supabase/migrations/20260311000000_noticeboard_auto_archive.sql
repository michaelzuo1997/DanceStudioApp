-- Enable pg_cron extension (Supabase has this available but it must be enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres role (required by Supabase)
GRANT USAGE ON SCHEMA cron TO postgres;

-- Auto-archive expired noticeboard entries daily at 3:00 AM UTC
SELECT cron.schedule(
  'archive-expired-notices',
  '0 3 * * *',
  $$
    UPDATE noticeboard
    SET is_active = false
    WHERE expires_at IS NOT NULL
      AND expires_at < now()
      AND is_active = true;
  $$
);
