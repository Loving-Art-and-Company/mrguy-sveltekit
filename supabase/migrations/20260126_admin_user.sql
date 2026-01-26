-- This migration adds the admin user to the admin_users table
-- Run this AFTER creating the user in Supabase Auth

-- First, get the user ID from auth.users where email = 'info@mrguydetail.com'
-- Then insert into admin_users

-- You can run this in the Supabase SQL Editor:
/*
INSERT INTO admin_users (user_id, brand_id)
SELECT 
  id,
  '074ccc70-e8b5-4284-907b-82571f4a2e45'
FROM auth.users 
WHERE email = 'info@mrguydetail.com'
ON CONFLICT DO NOTHING;
*/

-- Note: The user must be created in Supabase Auth first via:
-- 1. Dashboard: Authentication > Users > Add User
-- 2. Or via the Supabase client signUp method
