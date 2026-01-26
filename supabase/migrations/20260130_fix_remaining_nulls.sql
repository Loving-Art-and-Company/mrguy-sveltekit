-- Allow NULL on all remaining legacy columns
DO $$ 
DECLARE
    col_record RECORD;
BEGIN
    FOR col_record IN 
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND is_nullable = 'NO'
        AND column_name NOT IN ('id')
    LOOP
        EXECUTE format('ALTER TABLE bookings ALTER COLUMN %I DROP NOT NULL', col_record.column_name);
    END LOOP;
END $$;
