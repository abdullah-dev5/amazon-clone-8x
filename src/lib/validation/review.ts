import { z } from "zod";

// Accepts undefined, null, "", or a real string as input — undefined/null/""
// all normalize to the same `null` output. Accepting `null` as input (not
// just as this schema's own output) matters because a client may
// legitimately round-trip an already-normalized value back through this
// same schema (e.g. re-validating before an edit), and `null` must not be
// rejected just because it's also what this schema produces.
const titleField = z
  .string()
  .trim()
  .max(120, "Title is too long.")
  .nullish()
  .or(z.literal(""))
  .transform((v) => (v ? v : null));

const bodyField = z
  .string()
  .trim()
  .max(2000, "Review is too long.")
  .nullish()
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
