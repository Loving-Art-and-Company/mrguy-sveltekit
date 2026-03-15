-- Idempotency guard for Stripe webhook retries
CREATE TABLE IF NOT EXISTS processed_webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uidx_processed_webhook_events_event_id
  ON processed_webhook_events (event_id);
