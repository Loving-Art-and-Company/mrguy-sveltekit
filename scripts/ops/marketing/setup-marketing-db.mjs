import { getSql } from './db.mjs';

const sql = getSql();

try {
  await sql`
    CREATE TABLE IF NOT EXISTS "marketing_review_requests" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "booking_id" text NOT NULL REFERENCES "bookings"("id") ON DELETE CASCADE,
      "brand_id" uuid NOT NULL REFERENCES "brands"("id"),
      "contact" text NOT NULL,
      "sent_at" timestamp with time zone DEFAULT now() NOT NULL,
      "message_body" text NOT NULL,
      "status" text DEFAULT 'draft' NOT NULL,
      "review_received" boolean DEFAULT false NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS "idx_marketing_review_requests_booking_id"
    ON "marketing_review_requests" ("booking_id")
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS "idx_marketing_review_requests_brand_sent"
    ON "marketing_review_requests" ("brand_id", "sent_at")
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "marketing_gbp_posts" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "brand_id" uuid NOT NULL REFERENCES "brands"("id"),
      "post_type" text NOT NULL,
      "content" text NOT NULL,
      "generated_at" timestamp with time zone DEFAULT now() NOT NULL,
      "published_at" timestamp with time zone,
      "status" text DEFAULT 'draft' NOT NULL,
      "booking_id" text REFERENCES "bookings"("id") ON DELETE SET NULL,
      "media_urls" text[] DEFAULT '{}'::text[] NOT NULL
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS "idx_marketing_gbp_posts_brand_status"
    ON "marketing_gbp_posts" ("brand_id", "status", "generated_at")
  `;

  console.log('Marketing tables created/verified successfully.');
} catch (error) {
  console.error('Failed to set up marketing tables:', error instanceof Error ? error.message : String(error));
  process.exit(1);
} finally {
  await sql.end({ timeout: 5 });
}
