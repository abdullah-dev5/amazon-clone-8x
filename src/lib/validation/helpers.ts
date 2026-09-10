import { NextResponse } from "next/server";
import type { ZodType } from "zod";

/**
 * Parses an API request body against a zod schema. On failure, returns a
 * ready-to-return 400 NextResponse carrying the first validation issue's
 * message — never a raw zod/Prisma error, always the schema's own
 * human-written message. Route handlers use this instead of repeating
 * per-field `typeof x === "string"` checks.
 */
export function parseRequestBody<T>(
  schema: ZodType<T>,
  body: unknown
): { success: true; data: T } | { success: false; response: NextResponse } {
  const result = schema.safeParse(body);
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Invalid request.";
    return { success: false, response: NextResponse.json({ error: message }, { status: 400 }) };
  }
  return { success: true, data: result.data };
}
