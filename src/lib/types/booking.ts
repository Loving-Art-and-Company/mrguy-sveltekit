import { z } from 'zod';
import { SERVICE_PACKAGES, SUBSCRIPTION_TIERS, ADD_ONS, EXTRA_FEES } from '$lib/data/services';

// Step 1: Service selection
export const serviceStepSchema = z.object({
  packageId: z.string().refine(
    (id) => SERVICE_PACKAGES.some((p) => p.id === id) || SUBSCRIPTION_TIERS.some((t) => t.id === id),
    { message: 'Please select a valid service' }
  ),
  addons: z.array(z.string()).optional().default([]),
  extraFees: z.array(z.string()).optional().default([]),
});

// Step 2: Vehicle info (original - for backward compatibility)
export const vehicleStepSchema = z.object({
  make: z.string().min(1, 'Vehicle make is required'),
  model: z.string().min(1, 'Vehicle model is required'),
  year: z.coerce
    .number()
    .int()
    .min(1990, 'Year must be 1990 or later')
    .max(new Date().getFullYear() + 1, 'Invalid year'),
  color: z.string().optional(),
  notes: z.string().max(500, 'Notes must be under 500 characters').optional(),
});

// NEW: Simplified vehicle type for 3-step flow
export const vehicleTypeSchema = z.object({
  type: z.enum(['sedan', 'suv', 'truck']).refine((val) => val !== undefined, {
    message: 'Please select a vehicle type'
  }),
});

// Step 3: Date/time selection
export const dateStepSchema = z.object({
  date: z.string().refine(
    (d) => {
      const selected = new Date(d);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selected >= today;
    },
    { message: 'Please select a future date' }
  ),
  time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
});

// Step 4: Address
export const addressStepSchema = z.object({
  street: z.string().trim().min(5, 'Street address is required'),
  city: z.string().trim().min(2, 'City is required'),
  state: z.string().trim().length(2, 'Use 2-letter state code').default('FL'),
  zip: z.string().trim().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code'),
  instructions: z.string().max(300).optional(),
});

// Step 5: Contact & payment
export const paymentStepSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().regex(/^\+?1?\d{10,14}$/, 'Invalid phone number'),
  email: z.string().email('Invalid email').optional(),
  promoCode: z.string().optional(),
});

// Full booking schema
export const bookingSchema = z.object({
  service: serviceStepSchema,
  vehicle: vehicleStepSchema,
  schedule: dateStepSchema,
  address: addressStepSchema,
  contact: paymentStepSchema,
});

export type ServiceStep = z.infer<typeof serviceStepSchema>;
export type VehicleStep = z.infer<typeof vehicleStepSchema>;
export type VehicleType = z.infer<typeof vehicleTypeSchema>;
export type DateStep = z.infer<typeof dateStepSchema>;
export type AddressStep = z.infer<typeof addressStepSchema>;
export type PaymentStep = z.infer<typeof paymentStepSchema>;
export type BookingData = z.infer<typeof bookingSchema>;

// Booking steps - 4 step flow (service pre-selected from homepage)
export const BOOKING_STEPS = [
  { id: 'vehicle', label: 'Vehicle', schema: vehicleStepSchema },
  { id: 'schedule', label: 'Date & Time', schema: dateStepSchema },
  { id: 'address', label: 'Location', schema: addressStepSchema },
  { id: 'contact', label: 'Contact', schema: paymentStepSchema },
] as const;

export type StepId = (typeof BOOKING_STEPS)[number]['id'];

// ============================================
// NEW 3-STEP FLOW SCHEMAS
// ============================================

// Step 1: Service Selection + Location
export const serviceLocationStepSchema = z.object({
  // Service
  packageId: z.string().refine(
    (id) => SERVICE_PACKAGES.some((p) => p.id === id) || SUBSCRIPTION_TIERS.some((t) => t.id === id),
    { message: 'Please select a valid service' }
  ),
  // Location
  street: z.string().trim().min(5, 'Street address is required'),
  city: z.string().trim().min(2, 'City is required'),
  state: z.string().trim().length(2, 'Use 2-letter state code').default('FL'),
  zip: z.string().trim().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code'),
  placeId: z.string().optional(), // From Google Places API
});

// Step 2: Vehicle Type + Schedule
export const vehicleScheduleStepSchema = z.object({
  // Vehicle
  vehicleType: z.enum(['sedan', 'suv', 'truck']),
  // Schedule
  date: z.string().refine(
    (d) => {
      const selected = new Date(d);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selected >= today;
    },
    { message: 'Please select a future date' }
  ),
  time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
});

// Step 3: Contact Info + Review
export const contactReviewStepSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().regex(/^\+?1?\d{10,14}$/, 'Invalid phone number'),
  email: z.string().email('Invalid email').optional(),
  notes: z.string().max(500, 'Notes must be under 500 characters').optional(),
  promoCode: z.string().optional(),
});

// Full 3-step booking schema
export const booking3StepSchema = z.object({
  step1: serviceLocationStepSchema,
  step2: vehicleScheduleStepSchema,
  step3: contactReviewStepSchema,
});

// Export types for 3-step flow
export type ServiceLocationStep = z.infer<typeof serviceLocationStepSchema>;
export type VehicleScheduleStep = z.infer<typeof vehicleScheduleStepSchema>;
export type ContactReviewStep = z.infer<typeof contactReviewStepSchema>;
export type Booking3StepData = z.infer<typeof booking3StepSchema>;

// New 3-step booking steps
export const BOOKING_3_STEPS = [
  { id: 'step1', label: 'Service & Location', schema: serviceLocationStepSchema },
  { id: 'step2', label: 'Vehicle & Schedule', schema: vehicleScheduleStepSchema },
  { id: 'step3', label: 'Contact & Review', schema: contactReviewStepSchema },
] as const;

export type Step3Id = (typeof BOOKING_3_STEPS)[number]['id'];
