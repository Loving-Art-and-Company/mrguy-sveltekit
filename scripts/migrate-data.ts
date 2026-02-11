/**
 * Mr. Guy Mobile Detail — Data Migration: Supabase → Neon
 *
 * Migrates all data from the shared Supabase project to a dedicated Neon database.
 * Preserves UUIDs (both systems use gen_random_uuid()) — no remapping needed.
 * Bookings use text PKs (e.g., "BK-20260211-ABCD") — preserved as-is.
 *
 * IMPORTANT: The bookings table uses mixed camelCase column names in Supabase.
 * Columns like "clientName", "serviceName", "paymentStatus" are quoted identifiers.
 * The Drizzle schema maps these correctly.
 *
 * Prerequisites:
 *   1. Neon database provisioned with schema via `npx drizzle-kit push`
 *   2. Environment variables set (see below)
 *
 * Usage:
 *   SUPABASE_DB_URL="postgresql://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres" \
 *   DATABASE_URL="postgresql://..." \
 *   npx tsx scripts/migrate-data.ts
 *
 * Migration order (respects foreign key dependencies):
 *   1. users (from auth.users — reuse bcrypt hashes directly)
 *   2. brands
 *   3. admin_users
 *   4. client_profiles
 *   5. bookings
 *   6. notifications
 *   7. subscription_packages
 *   8. client_subscriptions
 *   9. credit_usage
 */

import postgres from 'postgres';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;
const NEON_DB_URL = process.env.DATABASE_URL;

if (!SUPABASE_DB_URL) {
  console.error('Missing SUPABASE_DB_URL environment variable');
  console.error(
    'Format: postgresql://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres'
  );
  process.exit(1);
}
if (!NEON_DB_URL) {
  console.error('Missing DATABASE_URL environment variable (Neon)');
  process.exit(1);
}

const source = postgres(SUPABASE_DB_URL, { ssl: 'require', max: 1 });
const target = postgres(NEON_DB_URL, { ssl: 'require', max: 1 });

// Mr. Guy brand ID — filters data from the shared Supabase project
const MRGUY_BRAND_ID = '074ccc70-e8b5-4284-907b-82571f4a2e45';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function countRows(
  db: ReturnType<typeof postgres>,
  table: string,
  schema = 'public'
) {
  const result =
    await db`SELECT count(*)::int as count FROM ${db(schema + '.' + table)}`;
  return result[0].count;
}

function log(msg: string) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

async function migrateTable(
  tableName: string,
  sourceQuery: () => Promise<Record<string, unknown>[]>,
  insertFn: (rows: Record<string, unknown>[]) => Promise<void>
) {
  log(`→ Migrating ${tableName}...`);
  const rows = await sourceQuery();
  if (rows.length === 0) {
    log(`  ✓ ${tableName}: 0 rows (empty)`);
    return 0;
  }

  // Insert in batches of 100
  const BATCH_SIZE = 100;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await insertFn(batch);
  }

  log(`  ✓ ${tableName}: ${rows.length} rows migrated`);
  return rows.length;
}

// ---------------------------------------------------------------------------
// Migration Steps
// ---------------------------------------------------------------------------

async function migrateUsers() {
  return migrateTable(
    'users',
    async () => {
      // Read from Supabase auth.users — reuse bcrypt hashes directly
      // bcryptjs.compare() works with Supabase-generated bcrypt hashes
      return source`
        SELECT
          id,
          email,
          encrypted_password as password_hash,
          CASE WHEN banned_until IS NULL THEN true ELSE false END as is_active,
          created_at,
          COALESCE(updated_at, created_at) as updated_at
        FROM auth.users
        ORDER BY created_at
      `;
    },
    async (rows) => {
      await target`
        INSERT INTO users ${target(rows as any[], 'id', 'email', 'password_hash', 'is_active', 'created_at', 'updated_at')}
        ON CONFLICT (id) DO NOTHING
      `;
    }
  );
}

async function migrateBrands() {
  return migrateTable(
    'brands',
    async () => {
      return source`
        SELECT id, slug, name, domain, logo_url, contact_email, contact_phone,
               primary_color, secondary_color, timezone, currency, is_active,
               settings, created_at, updated_at
        FROM public.brands
        WHERE id = ${MRGUY_BRAND_ID}
        ORDER BY created_at
      `;
    },
    async (rows) => {
      await target`
        INSERT INTO brands ${target(rows as any[], 'id', 'slug', 'name', 'domain', 'logo_url', 'contact_email', 'contact_phone', 'primary_color', 'secondary_color', 'timezone', 'currency', 'is_active', 'settings', 'created_at', 'updated_at')}
        ON CONFLICT (id) DO NOTHING
      `;
    }
  );
}

async function migrateAdminUsers() {
  return migrateTable(
    'admin_users',
    async () => {
      return source`
        SELECT id, user_id, brand_id, created_at
        FROM public.admin_users
        WHERE brand_id = ${MRGUY_BRAND_ID}
        ORDER BY created_at
      `;
    },
    async (rows) => {
      await target`
        INSERT INTO admin_users ${target(rows as any[], 'id', 'user_id', 'brand_id', 'created_at')}
        ON CONFLICT (id) DO NOTHING
      `;
    }
  );
}

async function migrateClientProfiles() {
  return migrateTable(
    'client_profiles',
    async () => {
      return source`
        SELECT id, brand_id, phone, name, verified, created_at, updated_at
        FROM public.client_profiles
        WHERE brand_id = ${MRGUY_BRAND_ID} OR brand_id IS NULL
        ORDER BY created_at
      `;
    },
    async (rows) => {
      await target`
        INSERT INTO client_profiles ${target(rows as any[], 'id', 'brand_id', 'phone', 'name', 'verified', 'created_at', 'updated_at')}
        ON CONFLICT (id) DO NOTHING
      `;
    }
  );
}

async function migrateBookings() {
  // IMPORTANT: The bookings table has mixed camelCase column names.
  // Quoted identifiers are needed to read the camelCase columns from Supabase.
  return migrateTable(
    'bookings',
    async () => {
      return source`
        SELECT
          id,
          brand_id,
          "clientName",
          "serviceName",
          price,
          date,
          time,
          contact,
          "transactionId",
          "paymentMethod",
          notes,
          signature,
          status,
          "paymentStatus",
          "reminderSent",
          created_at
        FROM public.bookings
        WHERE brand_id = ${MRGUY_BRAND_ID} OR brand_id IS NULL
        ORDER BY created_at
      `;
    },
    async (rows) => {
      // Map camelCase fields from source to target column names
      // The Neon schema has the same camelCase column names (quoted identifiers)
      for (const row of rows) {
        await target`
          INSERT INTO bookings (
            id, brand_id, "clientName", "serviceName", price, date, time,
            contact, "transactionId", "paymentMethod", notes, signature,
            status, "paymentStatus", "reminderSent", created_at
          ) VALUES (
            ${row.id as string},
            ${(row.brand_id as string) || MRGUY_BRAND_ID},
            ${row.clientName as string},
            ${row.serviceName as string},
            ${(row.price as number) || 0},
            ${row.date as string},
            ${row.time as string | null},
            ${row.contact as string},
            ${row.transactionId as string | null},
            ${row.paymentMethod as string | null},
            ${row.notes as string | null},
            ${row.signature as string | null},
            ${(row.status as string) || 'pending'},
            ${(row.paymentStatus as string) || 'unpaid'},
            ${(row.reminderSent as boolean) || false},
            ${row.created_at as string}
          )
          ON CONFLICT (id) DO NOTHING
        `;
      }
    }
  );
}

async function migrateNotifications() {
  return migrateTable(
    'notifications',
    async () => {
      return source`
        SELECT id, brand_id, type, title, message, timestamp, "relatedId", read
        FROM public.notifications
        WHERE brand_id = ${MRGUY_BRAND_ID} OR brand_id IS NULL
        ORDER BY timestamp
      `;
    },
    async (rows) => {
      // Notifications also have camelCase "relatedId" column
      for (const row of rows) {
        await target`
          INSERT INTO notifications (
            id, brand_id, type, title, message, timestamp, "relatedId", read
          ) VALUES (
            ${row.id as string},
            ${(row.brand_id as string) || MRGUY_BRAND_ID},
            ${row.type as string},
            ${row.title as string},
            ${row.message as string},
            ${row.timestamp as number},
            ${row.relatedId as string | null},
            ${(row.read as boolean) || false}
          )
          ON CONFLICT (id) DO NOTHING
        `;
      }
    }
  );
}

async function migrateSubscriptionPackages() {
  return migrateTable(
    'subscription_packages',
    async () => {
      return source`
        SELECT id, brand_id, name, description, service_type, credits,
               price_cents, stripe_price_id, is_active, sort_order,
               created_at, updated_at
        FROM public.subscription_packages
        WHERE brand_id = ${MRGUY_BRAND_ID}
        ORDER BY sort_order
      `;
    },
    async (rows) => {
      await target`
        INSERT INTO subscription_packages ${target(rows as any[], 'id', 'brand_id', 'name', 'description', 'service_type', 'credits', 'price_cents', 'stripe_price_id', 'is_active', 'sort_order', 'created_at', 'updated_at')}
        ON CONFLICT (id) DO NOTHING
      `;
    }
  );
}

async function migrateClientSubscriptions() {
  return migrateTable(
    'client_subscriptions',
    async () => {
      return source`
        SELECT id, brand_id, client_id, package_id, stripe_payment_intent_id,
               credits_total, credits_remaining, status, purchased_at,
               expires_at, created_at, updated_at
        FROM public.client_subscriptions
        WHERE brand_id = ${MRGUY_BRAND_ID}
        ORDER BY created_at
      `;
    },
    async (rows) => {
      await target`
        INSERT INTO client_subscriptions ${target(rows as any[], 'id', 'brand_id', 'client_id', 'package_id', 'stripe_payment_intent_id', 'credits_total', 'credits_remaining', 'status', 'purchased_at', 'expires_at', 'created_at', 'updated_at')}
        ON CONFLICT (id) DO NOTHING
      `;
    }
  );
}

async function migrateCreditUsage() {
  return migrateTable(
    'credit_usage',
    async () => {
      // credit_usage doesn't have brand_id — join through client_subscriptions
      return source`
        SELECT cu.id, cu.subscription_id, cu.booking_id, cu.credits_used,
               cu.used_at, cu.notes
        FROM public.credit_usage cu
        JOIN public.client_subscriptions cs ON cu.subscription_id = cs.id
        WHERE cs.brand_id = ${MRGUY_BRAND_ID}
        ORDER BY cu.used_at
      `;
    },
    async (rows) => {
      await target`
        INSERT INTO credit_usage ${target(rows as any[], 'id', 'subscription_id', 'booking_id', 'credits_used', 'used_at', 'notes')}
        ON CONFLICT (id) DO NOTHING
      `;
    }
  );
}

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------

async function verify() {
  log('Verifying row counts...');

  // For source counts, we need brand-filtered counts
  const tables = [
    {
      name: 'users',
      sourceQuery: () =>
        source`SELECT count(*)::int as count FROM auth.users`,
    },
    {
      name: 'brands',
      sourceQuery: () =>
        source`SELECT count(*)::int as count FROM public.brands WHERE id = ${MRGUY_BRAND_ID}`,
    },
    {
      name: 'admin_users',
      sourceQuery: () =>
        source`SELECT count(*)::int as count FROM public.admin_users WHERE brand_id = ${MRGUY_BRAND_ID}`,
    },
    {
      name: 'client_profiles',
      sourceQuery: () =>
        source`SELECT count(*)::int as count FROM public.client_profiles WHERE brand_id = ${MRGUY_BRAND_ID} OR brand_id IS NULL`,
    },
    {
      name: 'bookings',
      sourceQuery: () =>
        source`SELECT count(*)::int as count FROM public.bookings WHERE brand_id = ${MRGUY_BRAND_ID} OR brand_id IS NULL`,
    },
    {
      name: 'notifications',
      sourceQuery: () =>
        source`SELECT count(*)::int as count FROM public.notifications WHERE brand_id = ${MRGUY_BRAND_ID} OR brand_id IS NULL`,
    },
    {
      name: 'subscription_packages',
      sourceQuery: () =>
        source`SELECT count(*)::int as count FROM public.subscription_packages WHERE brand_id = ${MRGUY_BRAND_ID}`,
    },
    {
      name: 'client_subscriptions',
      sourceQuery: () =>
        source`SELECT count(*)::int as count FROM public.client_subscriptions WHERE brand_id = ${MRGUY_BRAND_ID}`,
    },
    {
      name: 'credit_usage',
      sourceQuery: () =>
        source`SELECT count(*)::int as count FROM public.credit_usage cu JOIN public.client_subscriptions cs ON cu.subscription_id = cs.id WHERE cs.brand_id = ${MRGUY_BRAND_ID}`,
    },
  ];

  let allMatch = true;
  for (const t of tables) {
    const sourceResult = await t.sourceQuery();
    const sourceCount = sourceResult[0].count;
    const targetCount = await countRows(target, t.name);
    const match = sourceCount === targetCount ? '✓' : '✗ MISMATCH';
    if (sourceCount !== targetCount) allMatch = false;
    log(`  ${match} ${t.name}: source=${sourceCount} target=${targetCount}`);
  }

  return allMatch;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  log('Mr. Guy Mobile Detail — Data Migration: Supabase → Neon');
  log('=======================================================');

  try {
    // Run migrations in FK dependency order
    await migrateUsers();
    await migrateBrands();
    await migrateAdminUsers();
    await migrateClientProfiles();
    await migrateBookings();
    await migrateNotifications();
    await migrateSubscriptionPackages();
    await migrateClientSubscriptions();
    await migrateCreditUsage();

    log('');
    const allMatch = await verify();

    log('');
    if (allMatch) {
      log('Migration complete — all row counts match.');
    } else {
      log(
        'Migration complete — ROW COUNT MISMATCHES detected. Review above.'
      );
      process.exit(1);
    }
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await source.end();
    await target.end();
  }
}

main();
