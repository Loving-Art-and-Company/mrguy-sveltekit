-- Allow NULL on legacy camelCase columns so new booking flow works
-- These columns are from the old multi-step booking flow

ALTER TABLE bookings ALTER COLUMN "clientName" DROP NOT NULL;
ALTER TABLE bookings ALTER COLUMN "serviceName" DROP NOT NULL;
ALTER TABLE bookings ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
