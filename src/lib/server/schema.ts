// src/lib/server/schema.ts
// Drizzle ORM table definitions for Mr. Guy Mobile Detail
// Translated from Supabase schema (database.ts types)

import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  index,
  jsonb,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ============================================================
// AUTH TABLES (new — replaces Supabase Auth)
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
// BOOKINGS
// Note: Original Supabase schema uses mixed camelCase/snake_case.
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
