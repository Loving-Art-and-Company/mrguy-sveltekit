-- Add promo_code column to bookings table for tracking promotional campaigns

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS promo_code TEXT;

-- Create index for querying by promo code
CREATE INDEX IF NOT EXISTS idx_bookings_promo_code ON bookings(promo_code);
