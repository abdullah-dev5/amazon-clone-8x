import { z } from "zod";

const titleField = z
  .string()
  .trim()
  .max(120, "Title is too long.")
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v : null));

const bodyField = z
  .string()
  .trim()
  .max(2000, "Review is too long.")
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v : null));

export const createReviewSchema = z.object({
  productId: z.string().trim().min(1, "A product is required."),
  rating: z
    .number()
    .int("Choose a rating from 1 to 5.")
    .min(1, "Choose a rating from 1 to 5.")
    .max(5, "Choose a rating from 1 to 5."),
  title: titleField,
  body: bodyField,
});

export const updateReviewSchema = createReviewSchema.omit({ productId: true });

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
