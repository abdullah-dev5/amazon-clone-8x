import { NextResponse } from "next/server";

/**
 * Wraps a route handler so any error not already handled inside it (and
 * turned into a specific response — a known Prisma error code, a domain
 * error like insufficient stock, etc.) is logged server-side with route
 * context before a generic, safe message is returned to the client.
 * Never logs the request body — request bodies in this app can carry a
 * password or a card number, so route-specific context worth logging
 * (an order id, a user id) should be included by the handler itself via
 * a nested try/catch, not recovered from here.
 */
export function withApiErrorLogging<Args extends unknown[]>(
  routeName: string,
  handler: (...args: Args) => Promise<NextResponse>
): (...args: Args) => Promise<NextResponse> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (err) {
      console.error(`${routeName}: unexpected error`, err);
      return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
  };
}
