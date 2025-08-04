-- Enable pg_cron extension for scheduled jobs
SELECT cron.schedule(
  'daily-trip-reminders',
  '0 18 * * *', -- Daily at 6:00 PM (18:00)
  $$
  SELECT
    net.http_post(
        url := 'https://ninybkgnipuxmvcaxkwt.supabase.co/functions/v1/send-trip-notifications',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pbnlia2duaXB1eG12Y2F4a3d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMDg0NzYsImV4cCI6MjA2ODY4NDQ3Nn0.SO41zfL2l6SKJEKWd1gr0fTDfMJdeAxrvLIPpMsMVzk"}'::jsonb,
        body := '{"automated": true}'::jsonb
    ) as request_id;
  $$
);