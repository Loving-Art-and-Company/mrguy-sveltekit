/**
 * Seed the Mr. Guy brand record and link admin user.
 * Run after schema push and create-admin.ts
 *
 * Usage: DATABASE_URL="..." npx tsx scripts/seed-brand.ts
 */

import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL');
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { ssl: 'require', max: 1 });
const MRGUY_BRAND_ID = '074ccc70-e8b5-4284-907b-82571f4a2e45';

async function seed() {
  console.log('Seeding Mr. Guy brand...');

  // Insert brand
  await sql`
    INSERT INTO brands (id, slug, name, domain, contact_email, primary_color, secondary_color, timezone, currency, is_active, settings)
    VALUES (
      ${MRGUY_BRAND_ID},
      'mrguy',
      'Mr. Guy Mobile Detail',
      'mrguydetail.com',
      'info@mrguydetail.com',
      '#0ea5e9',
      '#10b981',
      'America/New_York',
      'USD',
      true,
      '{}'
    )
    ON CONFLICT (id) DO NOTHING
  `;
  console.log('✓ Brand created');

  // Link admin user
  const users = await sql`SELECT id, email FROM users WHERE email = 'admin@mrguydetail.com'`;
  if (users.length > 0) {
    const user = users[0];
    await sql`
      INSERT INTO admin_users (user_id, brand_id)
      VALUES (${user.id}, ${MRGUY_BRAND_ID})
      ON CONFLICT DO NOTHING
    `;
    console.log(`✓ Admin role assigned for ${user.email}`);
  } else {
    console.log('⚠ No admin user found — run create-admin.ts first');
  }

  // Verify counts
  const tables = ['users', 'brands', 'admin_users'];
  for (const t of tables) {
    const result = await sql`SELECT count(*)::int as count FROM ${sql(t)}`;
    console.log(`  ${t}: ${result[0].count} rows`);
  }

  await sql.end();
  console.log('\nDone. You can now login at /admin/login');
}

seed();
