-- Subscription Packages (the products customers can buy)
CREATE TABLE IF NOT EXISTS subscription_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id),
  name TEXT NOT NULL,
  description TEXT,
  service_type TEXT NOT NULL, -- 'exterior', 'interior', 'full_detail', 'ceramic'
  credits INTEGER NOT NULL, -- number of appointments included
  price_cents INTEGER NOT NULL, -- price in cents
  stripe_price_id TEXT, -- Stripe price ID for checkout
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client Subscriptions (purchased packages)
CREATE TABLE IF NOT EXISTS client_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id),
  client_id UUID REFERENCES client_profiles(id) ON DELETE CASCADE,
  package_id UUID REFERENCES subscription_packages(id),
  stripe_payment_intent_id TEXT,
  credits_total INTEGER NOT NULL, -- total credits purchased
  credits_remaining INTEGER NOT NULL, -- credits left to use
  status TEXT DEFAULT 'active', -- 'active', 'exhausted', 'expired', 'cancelled'
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- optional expiration date
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit Usage Log (track when credits are used)
CREATE TABLE IF NOT EXISTS credit_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES client_subscriptions(id) ON DELETE CASCADE,
  booking_id TEXT REFERENCES bookings(id) ON DELETE SET NULL,
  credits_used INTEGER NOT NULL DEFAULT 1,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Add client_id to bookings table to link appointments to clients
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES client_profiles(id);

-- Add subscription_id to bookings to track which package paid for the booking
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES client_subscriptions(id);

-- Insert default packages for Mr. Guy Mobile Detail
INSERT INTO subscription_packages (brand_id, name, description, service_type, credits, price_cents, sort_order)
VALUES 
  ('074ccc70-e8b5-4284-907b-82571f4a2e45', 'Basic 5-Pack', '5 exterior washes - Save $38!', 'exterior', 5, 19700, 1),
  ('074ccc70-e8b5-4284-907b-82571f4a2e45', 'Premium 5-Pack', '5 full details - Save $88!', 'full_detail', 5, 44700, 2),
  ('074ccc70-e8b5-4284-907b-82571f4a2e45', 'VIP 10-Pack', '10 full details + priority scheduling - Save $203!', 'full_detail', 10, 84700, 3)
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_subscriptions_client ON client_subscriptions(client_id);
CREATE INDEX IF NOT EXISTS idx_client_subscriptions_status ON client_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_credit_usage_subscription ON credit_usage(subscription_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings(client_id);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscription_packages_updated_at
  BEFORE UPDATE ON subscription_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_subscriptions_updated_at
  BEFORE UPDATE ON client_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
