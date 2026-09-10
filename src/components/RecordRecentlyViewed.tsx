"use client";

import { useEffect } from "react";

/**
 * Renders nothing. Fires a best-effort "record this view" request once per
 * product visit. Cookies can't be set while a Server Component renders (only
 * from a Route Handler/Server Action), so this is the smallest client-side
 * trigger for that — reuses the same "client fires a POST, a Route Handler
 * does the cookie mutation" shape already used for cart/wishlist, rather
 * than introducing Proxy/Middleware (which Next's own docs recommend
 * treating as a last resort) for one narrow purpose.
 */
export function RecordRecentlyViewed({ productId }: { productId: string }) {
  useEffect(() => {
    fetch("/api/recently-viewed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    }).catch(() => {
      // Best-effort — losing a "recently viewed" entry has no user-visible
      // consequence, so failures are swallowed rather than surfaced.
    });
  }, [productId]);

  return null;
}
