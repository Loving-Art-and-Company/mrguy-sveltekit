// src/lib/server/schema.ts
// Drizzle ORM table definitions for Mr. Guy Mobile Detail
// Database schema definitions for the MrGuy platform

import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  index,
  uniqueIndex,
  jsonb,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ============================================================
// AUTH TABLES
// ============================================================

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_sessions_token').on(t.token),
    index('idx_sessions_user_id').on(t.userId),
  ]
);

export const loginAttempts = pgTable(
  'login_attempts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull(),
    ipAddress: text('ip_address').notNull(),
    successful: boolean('successful').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('idx_login_attempts_email_ip').on(t.email, t.ipAddress)]
);

// ============================================================
// BRANDS
// ============================================================

export const brands = pgTable('brands', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  domain: text('domain'),
  logoUrl: text('logo_url'),
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
  primaryColor: text('primary_color'),
  secondaryColor: text('secondary_color'),
  timezone: text('timezone'),
  currency: text('currency'),
  isActive: boolean('is_active').default(true),
  settings: jsonb('settings'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================
// ADMIN USERS (links auth users to brands)
// ============================================================

export const adminUsers = pgTable(
  'admin_users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    brandId: uuid('brand_id').references(() => brands.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('idx_admin_users_user_id').on(t.userId)]
);

// ============================================================
// GOOGLE TOKENS (server-side storage for Calendar sync)
// ============================================================

export const googleTokens = pgTable('google_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  refreshToken: text('refresh_token').notNull(),
  accessToken: text('access_token'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  email: text('email'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================
// BOOKINGS
// Note: The bookings table uses mixed camelCase/snake_case columns.
// Drizzle maps camelCase properties to the ACTUAL column names.
// The DB columns are: id, brand_id, "clientName", "serviceName", price,
// date, time, contact, "transactionId", "paymentMethod", notes, signature,
// status, "paymentStatus", "reminderSent", created_at
// ============================================================

export const bookings = pgTable(
  'bookings',
  {
    id: text('id').primaryKey(), // e.g. "BK-20260211-ABCD" — NOT uuid
    brandId: uuid('brand_id').references(() => brands.id),
    clientName: text('clientName').notNull(),
    serviceName: text('serviceName').notNull(),
    price: integer('price').notNull(),
    date: text('date').notNull(), // YYYY-MM-DD
    time: text('time'), // HH:MM
    contact: text('contact').notNull(), // phone number
    transactionId: text('transactionId'),
    paymentMethod: text('paymentMethod'),
    notes: text('notes'),
    promoCode: text('promo_code'),
    signature: text('signature'),
    status: text('status').default('pending'),
    paymentStatus: text('paymentStatus').default('unpaid'),
    reminderSent: boolean('reminderSent').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [
    index('idx_bookings_brand_id').on(t.brandId),
    index('idx_bookings_date').on(t.date),
    index('idx_bookings_status').on(t.status),
    index('idx_bookings_contact').on(t.contact),
  ]
);

// ============================================================
// CLIENT PROFILES
// ============================================================

export const clientProfiles = pgTable(
  'client_profiles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    brandId: uuid('brand_id').references(() => brands.id),
    phone: text('phone').notNull().unique(),
    name: text('name').notNull(),
    verified: boolean('verified').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('idx_client_profiles_phone').on(t.phone)]
);

// ============================================================
// BUSINESS OPERATIONS
// ============================================================

export const mileageEntries = pgTable(
  'mileage_entries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    brandId: uuid('brand_id')
      .notNull()
      .references(() => brands.id),
    bookingId: text('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
    createdByUserId: uuid('created_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    entryDate: text('entry_date').notNull(),
    purpose: text('purpose').notNull(),
    miles: integer('miles').notNull(),
    startOdometer: integer('start_odometer'),
    endOdometer: integer('end_odometer'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_mileage_entries_brand_date').on(t.brandId, t.entryDate),
    index('idx_mileage_entries_booking_id').on(t.bookingId),
  ]
);

export const inventoryItems = pgTable(
  'inventory_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    brandId: uuid('brand_id')
      .notNull()
      .references(() => brands.id),
    createdByUserId: uuid('created_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    name: text('name').notNull(),
    sku: text('sku'),
    unitLabel: text('unit_label').default('units').notNull(),
    quantityOnHand: integer('quantity_on_hand').default(0).notNull(),
    reorderThreshold: integer('reorder_threshold').default(0).notNull(),
    unitCostCents: integer('unit_cost_cents').default(0).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_inventory_items_brand_name').on(t.brandId, t.name),
    index('idx_inventory_items_brand_active').on(t.brandId, t.isActive),
  ]
);

export const inventoryMovements = pgTable(
  'inventory_movements',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    brandId: uuid('brand_id')
      .notNull()
      .references(() => brands.id),
    itemId: uuid('item_id')
      .notNull()
      .references(() => inventoryItems.id, { onDelete: 'cascade' }),
    bookingId: text('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
    createdByUserId: uuid('created_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    occurredOn: text('occurred_on').notNull(),
    movementType: text('movement_type').notNull(),
    quantityDelta: integer('quantity_delta').notNull(),
    totalCostCents: integer('total_cost_cents').default(0).notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_inventory_movements_brand_date').on(t.brandId, t.occurredOn),
    index('idx_inventory_movements_item_id').on(t.itemId),
  ]
);

export const financeEntries = pgTable(
  'finance_entries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    brandId: uuid('brand_id')
      .notNull()
      .references(() => brands.id),
    bookingId: text('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
    createdByUserId: uuid('created_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    entryDate: text('entry_date').notNull(),
    entryType: text('entry_type').notNull(),
    category: text('category').notNull(),
    amountCents: integer('amount_cents').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_finance_entries_brand_date').on(t.brandId, t.entryDate),
    index('idx_finance_entries_type').on(t.entryType),
    index('idx_finance_entries_booking_id').on(t.bookingId),
  ]
);

// ============================================================
// PAYROLL
// ============================================================

export const payrollEntries = pgTable(
  'payroll_entries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    brandId: uuid('brand_id')
      .notNull()
      .references(() => brands.id),
    createdByUserId: uuid('created_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    workerName: text('worker_name').notNull(),
    payPeriodStart: text('pay_period_start').notNull(),
    payPeriodEnd: text('pay_period_end').notNull(),
    totalJobs: integer('total_jobs').notNull(),
    grossRevenueCents: integer('gross_revenue_cents').notNull(),
    payoutRatePercent: integer('payout_rate_percent').notNull(),
    payoutCents: integer('payout_cents').notNull(),
    mileageMiles: integer('mileage_miles').default(0).notNull(),
    mileageDeductionCents: integer('mileage_deduction_cents').default(0).notNull(),
    supplyCostCents: integer('supply_cost_cents').default(0).notNull(),
    netToBusinessCents: integer('net_to_business_cents').notNull(),
    status: text('status').default('draft').notNull(),
    paidDate: text('paid_date'),
    paidMethod: text('paid_method'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_payroll_entries_brand_period').on(t.brandId, t.payPeriodStart),
    index('idx_payroll_entries_status').on(t.status),
  ]
);

// ============================================================
// NOTIFICATIONS
// ============================================================

export const notifications = pgTable(
  'notifications',
  {
    id: text('id').primaryKey(), // app-generated ID
    brandId: uuid('brand_id').references(() => brands.id),
    type: text('type').notNull(),
    title: text('title').notNull(),
    message: text('message').notNull(),
    timestamp: integer('timestamp').notNull(), // unix ms
    relatedId: text('relatedId'),
    read: boolean('read').default(false),
  },
  (t) => [index('idx_notifications_brand_id').on(t.brandId)]
);

// ============================================================
// CRM CAMPAIGNS
// ============================================================

export const crmCampaignSends = pgTable(
  'crm_campaign_sends',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    brandId: uuid('brand_id')
      .notNull()
      .references(() => brands.id),
    createdByUserId: uuid('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    segmentId: text('segment_id').notNull(),
    segmentName: text('segment_name').notNull(),
    templateId: text('template_id').notNull(),
    templateName: text('template_name').notNull(),
    requestedRecipientCount: integer('requested_recipient_count').notNull(),
    suppressedRecipientCount: integer('suppressed_recipient_count').default(0).notNull(),
    sentCount: integer('sent_count').default(0).notNull(),
    failedCount: integer('failed_count').default(0).notNull(),
    status: text('status').default('sending').notNull(),
    failedRecipients: jsonb('failed_recipients').$type<string[]>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (t) => [
    index('idx_crm_campaign_sends_brand_id').on(t.brandId),
    index('idx_crm_campaign_sends_created_at').on(t.createdAt),
  ]
);

export const crmEmailUnsubscribes = pgTable(
  'crm_email_unsubscribes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    brandId: uuid('brand_id')
      .notNull()
      .references(() => brands.id),
    email: text('email').notNull(),
    source: text('source').notNull(),
    reason: text('reason'),
    campaignSendId: uuid('campaign_send_id').references(() => crmCampaignSends.id, {
      onDelete: 'set null',
    }),
    createdByUserId: uuid('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_crm_email_unsubscribes_brand_id').on(t.brandId),
    index('idx_crm_email_unsubscribes_unsubscribed_at').on(t.unsubscribedAt),
    uniqueIndex('uidx_crm_email_unsubscribes_brand_email').on(t.brandId, t.email),
  ]
);

// ============================================================
// SUBSCRIPTION PACKAGES
// ============================================================

export const subscriptionPackages = pgTable('subscription_packages', {
  id: uuid('id').defaultRandom().primaryKey(),
  brandId: uuid('brand_id').references(() => brands.id),
  name: text('name').notNull(),
  description: text('description'),
  serviceType: text('service_type').notNull(),
  credits: integer('credits').notNull(),
  priceCents: integer('price_cents').notNull(),
  stripePriceId: text('stripe_price_id'),
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================
// CLIENT SUBSCRIPTIONS
// ============================================================

export const clientSubscriptions = pgTable(
  'client_subscriptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    brandId: uuid('brand_id').references(() => brands.id),
    clientId: uuid('client_id')
      .notNull()
      .references(() => clientProfiles.id),
    packageId: uuid('package_id')
      .notNull()
      .references(() => subscriptionPackages.id),
    stripePaymentIntentId: text('stripe_payment_intent_id'),
    creditsTotal: integer('credits_total').notNull(),
    creditsRemaining: integer('credits_remaining').notNull(),
    status: text('status').default('active'),
    purchasedAt: timestamp('purchased_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('idx_client_subscriptions_client_id').on(t.clientId)]
);

// ============================================================
// CREDIT USAGE
// ============================================================

export const creditUsage = pgTable('credit_usage', {
  id: uuid('id').defaultRandom().primaryKey(),
  subscriptionId: uuid('subscription_id')
    .notNull()
    .references(() => clientSubscriptions.id),
  bookingId: text('booking_id').references(() => bookings.id),
  creditsUsed: integer('credits_used').default(1).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }).defaultNow().notNull(),
  notes: text('notes'),
});
