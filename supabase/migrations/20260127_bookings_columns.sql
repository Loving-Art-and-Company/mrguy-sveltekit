-- Add columns to bookings table for modal booking flow
-- Using IF NOT EXISTS for idempotency

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_id TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_name TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_price DECIMAL(10, 2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS scheduled_date DATE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS scheduled_time TIME;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS address_street TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS address_city TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS address_state TEXT DEFAULT 'FL';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS address_zip TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS address_instructions TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS vehicle_info_pending BOOLEAN DEFAULT true;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_date ON bookings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_phone ON bookings(customer_phone);
