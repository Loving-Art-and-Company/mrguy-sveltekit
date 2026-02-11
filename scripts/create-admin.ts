/**
 * Create admin user for Mr. Guy Mobile Detail (Neon/bcrypt version)
 *
 * Creates a user + admin_users entry in the Neon database.
 * Uses bcrypt for password hashing (matches runtime auth).
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/create-admin.ts [email] [password]
 *
 * Defaults:
 *   email: admin@mrguydetail.com
 *   password: (required — pass as 2nd argument)
 */

import postgres from 'postgres';
import bcrypt from 'bcryptjs';

const DATABASE_URL = process.env.DATABASE_URL;
const MRGUY_BRAND_ID = '074ccc70-e8b5-4284-907b-82571f4a2e45';

if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL environment variable');
  console.error(
    'Usage: DATABASE_URL="postgresql://..." npx tsx scripts/create-admin.ts [email] [password]'
  );
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { ssl: 'require', max: 1 });

async function createAdmin() {
  const email = process.argv[2] || 'admin@mrguydetail.com';
  const password = process.argv[3];

  if (!password) {
    console.error('Password is required as 2nd argument');
    console.error(
      'Usage: DATABASE_URL="..." npx tsx scripts/create-admin.ts admin@mrguydetail.com YourPassword123!'
    );
    process.exit(1);
  }

  console.log(`Creating admin user: ${email}`);

  // Hash password with bcrypt (12 rounds — matches runtime auth)
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    // Insert user (upsert on email — updates password if user exists)
    const [user] = await sql`
      INSERT INTO users (email, password_hash, is_active)
      VALUES (${email}, ${passwordHash}, true)
      ON CONFLICT (email) DO UPDATE SET password_hash = ${passwordHash}
      RETURNING id, email
    `;

    console.log('✓ User created/updated');
    console.log('  Email:', user.email);
    console.log('  ID:', user.id);

    // Insert admin_users link
    await sql`
      INSERT INTO admin_users (user_id, brand_id)
      VALUES (${user.id}, ${MRGUY_BRAND_ID})
      ON CONFLICT DO NOTHING
    `;

    console.log('✓ Admin role assigned for Mr. Guy brand');
    console.log('\nYou can now login at /admin/login');
  } catch (err) {
    console.error('Error creating admin:', err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

createAdmin();
