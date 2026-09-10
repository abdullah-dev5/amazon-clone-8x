import { cookies } from "next/headers";

const RECENTLY_VIEWED_COOKIE = "recently_viewed";
const MAX_RECENTLY_VIEWED = 10;

/**
 * Cookie-backed, works identically for guests and signed-in users (there's
 * no server-side use for this beyond "what did this browser look at," so
 * unlike the cart it never needs a DB-backed / guest-cookie duality).
 */
export async function getRecentlyViewedIds(): Promise<string[]> {
  const store = await cookies();
  const raw = store.get(RECENTLY_VIEWED_COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

/**
 * Moves productId to the front (de-duplicating rather than pushing a
 * second entry) and caps the list. Cookies can only be set from a Route
 * Handler or Server Action, never during a Server Component's render — see
 * api/recently-viewed/route.ts for the caller.
 */
export async function recordProductView(productId: string) {
  const existing = await getRecentlyViewedIds();
  const next = [productId, ...existing.filter((id) => id !== productId)].slice(0, MAX_RECENTLY_VIEWED);
  const store = await cookies();
  store.set(RECENTLY_VIEWED_COOKIE, JSON.stringify(next), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
}
