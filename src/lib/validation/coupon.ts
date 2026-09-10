import { z } from "zod";

export const couponCodeSchema = z
  .string()
  .trim()
  .min(1, "Enter a coupon code.")
  .max(30, "Coupon code is too long.")
  .regex(/^[A-Za-z0-9-]+$/, "Coupon codes contain only letters, numbers, and dashes.");
