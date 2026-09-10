import { z } from "zod";

/** For adding to cart — quantity must be a positive add. */
export const addCartItemSchema = z.object({
  variantId: z.string().trim().min(1, "A product variant is required."),
  quantity: z.number().int("Quantity must be a whole number.").min(1, "Quantity must be at least 1.").max(99, "Quantity cannot exceed 99."),
});

/** For updating a line's quantity — 0 is meaningful (removes the line). */
export const updateCartItemSchema = z.object({
  quantity: z.number().int("Quantity must be a whole number.").min(0, "Quantity cannot be negative.").max(99, "Quantity cannot exceed 99."),
});
