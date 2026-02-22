// src/lib/repositories/clientProfileRepo.ts
// Client profile data access layer — replaces supabaseAdmin.from('client_profiles') calls

import { db } from '$lib/server/db';
import { clientProfiles } from '$lib/server/schema';
import { eq, sql } from 'drizzle-orm';

const MRGUY_BRAND_ID = '074ccc70-e8b5-4284-907b-82571f4a2e45';

export type ClientProfileRow = typeof clientProfiles.$inferSelect;

/** Upsert a client profile by phone number */
export async function upsert(data: {
  phone: string;
  name: string;
  verified?: boolean;
}): Promise<ClientProfileRow | null> {
  const rows = await db
    .insert(clientProfiles)
    .values({
      brandId: MRGUY_BRAND_ID,
      phone: data.phone,
      name: data.name,
      verified: data.verified ?? false,
    })
    .onConflictDoUpdate({
      target: clientProfiles.phone,
      set: {
        name: data.name,
        verified: data.verified ?? sql`${clientProfiles.verified}`,
        updatedAt: new Date(),
      },
    })
    .returning();
  return rows[0] ?? null;
}

/** Get client by phone */
export async function getByPhone(phone: string): Promise<ClientProfileRow | null> {
  const rows = await db
    .select()
    .from(clientProfiles)
    .where(eq(clientProfiles.phone, phone))
    .limit(1);
  return rows[0] ?? null;
}
