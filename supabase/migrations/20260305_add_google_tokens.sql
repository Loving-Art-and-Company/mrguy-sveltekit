-- Google tokens table for Calendar sync
CREATE TABLE IF NOT EXISTS google_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  refresh_token TEXT NOT NULL,
  access_token TEXT,
  expires_at TIMESTAMPTZ,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
