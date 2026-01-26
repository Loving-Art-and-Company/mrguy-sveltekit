-- Add new columns to existing bookings table for modal booking flow
-- This migration is idempotent - safe to run multiple times

-- Add columns if they don't exist
DO $$ 
BEGIN
    -- Service columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'service_id') THEN
        ALTER TABLE bookings ADD COLUMN service_id TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'service_name') THEN
        ALTER TABLE bookings ADD COLUMN service_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'service_price') THEN
        ALTER TABLE bookings ADD COLUMN service_price DECIMAL(10, 2);
    END IF;

    -- Schedule columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'scheduled_date') THEN
        ALTER TABLE bookings ADD COLUMN scheduled_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'scheduled_time') THEN
        ALTER TABLE bookings ADD COLUMN scheduled_time TIME;
    END IF;

    -- Address columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'address_street') THEN
        ALTER TABLE bookings ADD COLUMN address_street TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'address_city') THEN
        ALTER TABLE bookings ADD COLUMN address_city TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'address_state') THEN
        ALTER TABLE bookings ADD COLUMN address_state TEXT DEFAULT 'FL';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'address_zip') THEN
        ALTER TABLE bookings ADD COLUMN address_zip TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'address_instructions') THEN
        ALTER TABLE bookings ADD COLUMN address_instructions TEXT;
    END IF;

    -- Customer columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'customer_name') THEN
        ALTER TABLE bookings ADD COLUMN customer_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'customer_phone') THEN
        ALTER TABLE bookings ADD COLUMN customer_phone TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'customer_email') THEN
        ALTER TABLE bookings ADD COLUMN customer_email TEXT;
    END IF;

    -- Vehicle columns (for later collection)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'vehicle_make') THEN
        ALTER TABLE bookings ADD COLUMN vehicle_make TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'vehicle_model') THEN
        ALTER TABLE bookings ADD COLUMN vehicle_model TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'vehicle_year') THEN
        ALTER TABLE bookings ADD COLUMN vehicle_year INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'vehicle_color') THEN
        ALTER TABLE bookings ADD COLUMN vehicle_color TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'vehicle_info_pending') THEN
        ALTER TABLE bookings ADD COLUMN vehicle_info_pending BOOLEAN DEFAULT true;
    END IF;

    -- Status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'status') THEN
        ALTER TABLE bookings ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;

END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_date ON bookings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_phone ON bookings(customer_phone);

-- Enable RLS if not already enabled
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policies (drop first if exists to avoid conflicts)
DROP POLICY IF EXISTS "Admin full access to bookings" ON bookings;
DROP POLICY IF EXISTS "Public can create bookings" ON bookings;
DROP POLICY IF EXISTS "Service role full access" ON bookings;

-- Policy: Service role can do everything (for API)
CREATE POLICY "Service role full access" ON bookings
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Policy: Admin can do everything
CREATE POLICY "Admin full access to bookings" ON bookings
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.user_id = auth.uid()
        )
    );

-- Policy: Anyone can insert (for public booking via API)
CREATE POLICY "Public can create bookings" ON bookings
    FOR INSERT
    TO anon
    WITH CHECK (true);
