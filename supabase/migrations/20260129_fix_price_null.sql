-- Allow NULL on price column (legacy)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'price') THEN
        ALTER TABLE bookings ALTER COLUMN "price" DROP NOT NULL;
    END IF;
END $$;
