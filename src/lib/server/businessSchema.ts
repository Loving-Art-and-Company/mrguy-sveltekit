import { sql } from 'drizzle-orm';
import { db } from '$lib/server/db';

let schemaInitPromise: Promise<void> | null = null;

async function createBusinessTables(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "mileage_entries" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "brand_id" uuid NOT NULL REFERENCES "brands"("id"),
      "booking_id" text REFERENCES "bookings"("id") ON DELETE SET NULL,
      "created_by_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
      "entry_date" text NOT NULL,
      "purpose" text NOT NULL,
      "miles" integer NOT NULL,
      "start_odometer" integer,
      "end_odometer" integer,
      "notes" text,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "inventory_items" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "brand_id" uuid NOT NULL REFERENCES "brands"("id"),
      "created_by_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
      "name" text NOT NULL,
      "sku" text,
      "unit_label" text DEFAULT 'units' NOT NULL,
      "quantity_on_hand" integer DEFAULT 0 NOT NULL,
      "reorder_threshold" integer DEFAULT 0 NOT NULL,
      "unit_cost_cents" integer DEFAULT 0 NOT NULL,
      "is_active" boolean DEFAULT true NOT NULL,
      "notes" text,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "inventory_movements" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "brand_id" uuid NOT NULL REFERENCES "brands"("id"),
      "item_id" uuid NOT NULL REFERENCES "inventory_items"("id") ON DELETE CASCADE,
      "booking_id" text REFERENCES "bookings"("id") ON DELETE SET NULL,
      "created_by_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
      "occurred_on" text NOT NULL,
      "movement_type" text NOT NULL,
      "quantity_delta" integer NOT NULL,
      "total_cost_cents" integer DEFAULT 0 NOT NULL,
      "notes" text,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "finance_entries" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "brand_id" uuid NOT NULL REFERENCES "brands"("id"),
      "booking_id" text REFERENCES "bookings"("id") ON DELETE SET NULL,
      "created_by_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
      "entry_date" text NOT NULL,
      "entry_type" text NOT NULL,
      "category" text NOT NULL,
      "amount_cents" integer NOT NULL,
      "notes" text,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    )
  `);

  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS "idx_mileage_entries_brand_date" ON "mileage_entries" ("brand_id", "entry_date")`
  );
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS "idx_mileage_entries_booking_id" ON "mileage_entries" ("booking_id")`
  );
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS "idx_inventory_items_brand_name" ON "inventory_items" ("brand_id", "name")`
  );
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS "idx_inventory_items_brand_active" ON "inventory_items" ("brand_id", "is_active")`
  );
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS "idx_inventory_movements_brand_date" ON "inventory_movements" ("brand_id", "occurred_on")`
  );
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS "idx_inventory_movements_item_id" ON "inventory_movements" ("item_id")`
  );
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS "idx_finance_entries_brand_date" ON "finance_entries" ("brand_id", "entry_date")`
  );
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS "idx_finance_entries_type" ON "finance_entries" ("entry_type")`
  );
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS "idx_finance_entries_booking_id" ON "finance_entries" ("booking_id")`
  );
}

export function ensureBusinessSchema(): Promise<void> {
  if (!schemaInitPromise) {
    schemaInitPromise = createBusinessTables().catch((error) => {
      schemaInitPromise = null;
      throw error;
    });
  }

  return schemaInitPromise;
}
