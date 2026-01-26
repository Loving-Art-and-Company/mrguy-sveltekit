/**
 * Database types for Mr. Guy Mobile Detail
 * Matches actual Supabase schema (camelCase columns)
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// Brand ID for Mr. Guy Mobile Detail
export const MRGUY_BRAND_ID = '074ccc70-e8b5-4284-907b-82571f4a2e45';

export type Database = {
  public: {
    CompositeTypes: Record<string, never>;
    Tables: {
      bookings: {
        Row: {
          id: string; // text PK (e.g., "BK-2026-001")
          brand_id: string | null;
          clientName: string;
          serviceName: string;
          price: number;
          date: string;
          time: string | null;
          contact: string; // phone number
          transactionId: string | null;
          paymentMethod: string | null;
          notes: string | null;
          signature: string | null;
          status: string | null; // default 'pending'
          paymentStatus: string | null; // default 'unpaid'
          reminderSent: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          brand_id?: string | null;
          clientName: string;
          serviceName: string;
          price: number;
          date: string;
          time?: string | null;
          contact: string;
          transactionId?: string | null;
          paymentMethod?: string | null;
          notes?: string | null;
          signature?: string | null;
          status?: string | null;
          paymentStatus?: string | null;
          reminderSent?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          brand_id?: string | null;
          clientName?: string;
          serviceName?: string;
          price?: number;
          date?: string;
          time?: string | null;
          contact?: string;
          transactionId?: string | null;
          paymentMethod?: string | null;
          notes?: string | null;
          signature?: string | null;
          status?: string | null;
          paymentStatus?: string | null;
          reminderSent?: boolean | null;
        };
        Relationships: [];
      };
      client_profiles: {
        Row: {
          id: string;
          brand_id: string | null;
          phone: string;
          name: string;
          verified: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          brand_id?: string | null;
          phone: string;
          name: string;
          verified?: boolean | null;
        };
        Update: {
          brand_id?: string | null;
          phone?: string;
          name?: string;
          verified?: boolean | null;
        };
        Relationships: [];
      };
      admin_users: {
        Row: {
          id: string;
          user_id: string;
          brand_id: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          brand_id?: string | null;
        };
        Update: {
          user_id?: string;
          brand_id?: string | null;
        };
        Relationships: [];
      };
      brands: {
        Row: {
          id: string;
          slug: string;
          name: string;
          domain: string | null;
          logo_url: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          primary_color: string | null;
          secondary_color: string | null;
          timezone: string | null;
          currency: string | null;
          is_active: boolean | null;
          settings: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          slug: string;
          name: string;
          domain?: string | null;
          logo_url?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          primary_color?: string | null;
          secondary_color?: string | null;
          timezone?: string | null;
          currency?: string | null;
          is_active?: boolean | null;
          settings?: Json | null;
        };
        Update: {
          slug?: string;
          name?: string;
          domain?: string | null;
          logo_url?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          primary_color?: string | null;
          secondary_color?: string | null;
          timezone?: string | null;
          currency?: string | null;
          is_active?: boolean | null;
          settings?: Json | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          brand_id: string | null;
          type: string;
          title: string;
          message: string;
          timestamp: number;
          relatedId: string | null;
          read: boolean | null;
        };
        Insert: {
          id: string;
          brand_id?: string | null;
          type: string;
          title: string;
          message: string;
          timestamp: number;
          relatedId?: string | null;
          read?: boolean | null;
        };
        Update: {
          id?: string;
          brand_id?: string | null;
          type?: string;
          title?: string;
          message?: string;
          timestamp?: number;
          relatedId?: string | null;
          read?: boolean | null;
        };
        Relationships: [];
      };
      subscription_packages: {
        Row: {
          id: string;
          brand_id: string | null;
          name: string;
          description: string | null;
          service_type: string;
          credits: number;
          price_cents: number;
          stripe_price_id: string | null;
          is_active: boolean | null;
          sort_order: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          brand_id?: string | null;
          name: string;
          description?: string | null;
          service_type: string;
          credits: number;
          price_cents: number;
          stripe_price_id?: string | null;
          is_active?: boolean | null;
          sort_order?: number | null;
        };
        Update: {
          brand_id?: string | null;
          name?: string;
          description?: string | null;
          service_type?: string;
          credits?: number;
          price_cents?: number;
          stripe_price_id?: string | null;
          is_active?: boolean | null;
          sort_order?: number | null;
        };
        Relationships: [];
      };
      client_subscriptions: {
        Row: {
          id: string;
          brand_id: string | null;
          client_id: string;
          package_id: string;
          stripe_payment_intent_id: string | null;
          credits_total: number;
          credits_remaining: number;
          status: string | null;
          purchased_at: string;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          brand_id?: string | null;
          client_id: string;
          package_id: string;
          stripe_payment_intent_id?: string | null;
          credits_total: number;
          credits_remaining: number;
          status?: string | null;
          expires_at?: string | null;
        };
        Update: {
          brand_id?: string | null;
          client_id?: string;
          package_id?: string;
          stripe_payment_intent_id?: string | null;
          credits_total?: number;
          credits_remaining?: number;
          status?: string | null;
          expires_at?: string | null;
        };
        Relationships: [];
      };
      credit_usage: {
        Row: {
          id: string;
          subscription_id: string;
          booking_id: string | null;
          credits_used: number;
          used_at: string;
          notes: string | null;
        };
        Insert: {
          subscription_id: string;
          booking_id?: string | null;
          credits_used?: number;
          notes?: string | null;
        };
        Update: {
          subscription_id?: string;
          booking_id?: string | null;
          credits_used?: number;
          notes?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type Booking = Database['public']['Tables']['bookings']['Row'];
export type BookingInsert = Database['public']['Tables']['bookings']['Insert'];
export type BookingUpdate = Database['public']['Tables']['bookings']['Update'];

export type ClientProfile = Database['public']['Tables']['client_profiles']['Row'];
export type ClientProfileInsert = Database['public']['Tables']['client_profiles']['Insert'];

export type AdminUser = Database['public']['Tables']['admin_users']['Row'];
export type Brand = Database['public']['Tables']['brands']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];

export type SubscriptionPackage = Database['public']['Tables']['subscription_packages']['Row'];
export type SubscriptionPackageInsert = Database['public']['Tables']['subscription_packages']['Insert'];

export type ClientSubscription = Database['public']['Tables']['client_subscriptions']['Row'];
export type ClientSubscriptionInsert = Database['public']['Tables']['client_subscriptions']['Insert'];
export type ClientSubscriptionUpdate = Database['public']['Tables']['client_subscriptions']['Update'];

export type CreditUsage = Database['public']['Tables']['credit_usage']['Row'];
export type CreditUsageInsert = Database['public']['Tables']['credit_usage']['Insert'];
