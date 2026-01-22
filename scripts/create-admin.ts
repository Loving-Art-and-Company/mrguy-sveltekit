/**
 * Create admin user for Mr. Guy Mobile Detail
 * Run with: npx tsx scripts/create-admin.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load .env.local
const envFile = readFileSync('.env.local', 'utf-8');
const envVars: Record<string, string> = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)="?([^"]*)"?$/);
  if (match) envVars[match[1]] = match[2];
});

const SUPABASE_URL = envVars.PUBLIC_SUPABASE_URL || 'https://lmuvuushxqtzvihrnhxi.supabase.co';
const SUPABASE_SERVICE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required');
  console.error('Run: source .env.local && npx tsx scripts/create-admin.ts');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createAdmin() {
  const email = process.argv[2] || 'admin@mrguydetail.com';
  const password = process.argv[3] || 'MrGuy2024!';

  console.log(`Creating admin user: ${email}`);

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Skip email verification
    user_metadata: { role: 'admin' }
  });

  if (error) {
    console.error('Error creating user:', error.message);
    process.exit(1);
  }

  console.log('✓ Admin user created successfully');
  console.log('  Email:', data.user.email);
  console.log('  ID:', data.user.id);
  console.log('\nYou can now login at /admin/login');
}

createAdmin();
