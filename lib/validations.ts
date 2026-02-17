import { z } from "zod";

// ─── Enum Schemas ────────────────────────────────────────

export const UserRoleSchema = z.enum(["CONSUMER", "BUSINESS", "ADMIN"]);

export const BusinessCategorySchema = z.enum([
  "FITNESS",
  "YOGA",
  "SALON",
  "BARBERSHOP",
  "SPA",
  "MASSAGE",
  "DENTAL",
  "MEDICAL",
  "PHYSIOTHERAPY",
  "MENTAL_HEALTH",
  "RESTAURANT",
  "OTHER",
]);

export const CalendarProviderSchema = z.enum([
  "FRESHA",
  "MINDBODY",
  "JANEAPP",
  "CALENDLY",
  "MANUAL",
]);

export const CancellationStatusSchema = z.enum([
  "AVAILABLE",
  "BOOKED",
  "EXPIRED",
]);

export const BookingStatusSchema = z.enum([
  "CONFIRMED",
  "COMPLETED",
  "NO_SHOW",
  "CANCELLED",
]);

export const NotificationTypeSchema = z.enum([
  "NEW_CANCELLATION",
  "BOOKING_CONFIRMED",
  "BOOKING_CANCELLED",
  "REMINDER",
  "PROMO",
]);

// ─── User Schemas ────────────────────────────────────────

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().min(7).max(20).optional(),
  avatarUrl: z.string().url().optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  searchRadius: z.number().int().min(1).max(100).optional(),
});

export const setPreferencesSchema = z.object({
  preferences: z.array(
    z.object({
      category: BusinessCategorySchema,
      enabled: z.boolean(),
    })
  ),
});

// ─── Business Schemas ────────────────────────────────────

export const createBusinessSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().max(2000).optional(),
  category: BusinessCategorySchema,
  address: z.string().min(1).max(500),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  zip: z.string().min(3).max(20),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  phone: z.string().min(7).max(20).optional(),
  website: z.string().url().optional(),
});

export const updateBusinessSchema = createBusinessSchema.partial();

// ─── Service Schemas ─────────────────────────────────────

export const createServiceSchema = z.object({
  name: z.string().min(1).max(200),
  category: BusinessCategorySchema,
  durationMinutes: z.number().int().min(5).max(480),
  originalPrice: z.number().positive().max(99999),
  description: z.string().max(2000).optional(),
});

export const updateServiceSchema = createServiceSchema.partial();

// ─── Cancellation Schemas ────────────────────────────────

export const createCancellationSchema = z
  .object({
    serviceId: z.string().cuid(),
    originalStartTime: z.coerce.date().refine((d) => d > new Date(), {
      message: "Start time must be in the future",
    }),
    originalEndTime: z.coerce.date(),
    minDiscount: z.number().int().min(0).max(100).default(10),
    maxDiscount: z.number().int().min(0).max(100).default(50),
  })
  .refine((data) => data.originalEndTime > data.originalStartTime, {
    message: "End time must be after start time",
  })
  .refine((data) => data.maxDiscount >= data.minDiscount, {
    message: "Max discount must be >= min discount",
  });

// ─── Booking Schemas ─────────────────────────────────────

export const createBookingSchema = z.object({
  cancellationId: z.string().cuid(),
});

// ─── Review Schemas ──────────────────────────────────────

export const createReviewSchema = z.object({
  bookingId: z.string().cuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

// ─── Feed Query Schemas ──────────────────────────────────

export const feedQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(1).max(100).default(10), // km
  category: BusinessCategorySchema.optional(),
  minDiscount: z.coerce.number().int().min(0).max(100).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// ─── Watchlist Schemas ───────────────────────────────────

export const toggleWatchlistSchema = z.object({
  businessId: z.string().cuid(),
});

// ─── Type Exports ────────────────────────────────────────

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type SetPreferencesInput = z.infer<typeof setPreferencesSchema>;
export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;
export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type CreateCancellationInput = z.infer<typeof createCancellationSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type FeedQueryInput = z.infer<typeof feedQuerySchema>;
export type ToggleWatchlistInput = z.infer<typeof toggleWatchlistSchema>;
