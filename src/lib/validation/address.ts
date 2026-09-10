import { z } from "zod";

export const addressSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required.").max(100, "Full name is too long."),
  line1: z.string().trim().min(1, "Address line 1 is required.").max(200, "Address is too long."),
  line2: z
    .string()
    .trim()
    .max(200, "Address is too long.")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
  city: z.string().trim().min(1, "City is required.").max(100, "City name is too long."),
  state: z.string().trim().min(1, "State is required.").max(50, "State is too long."),
  postalCode: z
    .string()
    .trim()
    .min(1, "ZIP code is required.")
    .regex(/^\d{5}(-\d{4})?$/, "Enter a valid ZIP code (e.g. 12345 or 12345-6789)."),
  country: z.string().trim().min(2).max(2).optional().default("US"),
  phone: z
    .string()
    .trim()
    .regex(/^[\d\s()+-]{7,20}$/, "Enter a valid phone number.")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
});
export type AddressInput = z.infer<typeof addressSchema>;
