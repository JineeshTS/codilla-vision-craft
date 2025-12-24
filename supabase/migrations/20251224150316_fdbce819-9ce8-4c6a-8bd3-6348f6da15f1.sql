-- Enable required extensions for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Schedule email queue processing every 5 minutes
SELECT cron.schedule(
  'process-email-queue-every-5-min',
  '*/5 * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://numyfjzmrtvzclgyfkpx.supabase.co/functions/v1/process-email-queue',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51bXlmanptcnR2emNsZ3lma3B4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMTE1NjMsImV4cCI6MjA3NzY4NzU2M30.v4pd3hWBjf-btAW3THhmhNV0pXf9yXVJjTEfDMjpULw"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);