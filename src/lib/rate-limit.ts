/**
 * In-memory sliding-window rate limiter. Appropriate for this app's current
 * single-process architecture (explicitly not adding Redis or similar for
 * a dev-only deployment target) — resets on restart and doesn't share state
 * across instances, which is an acceptable tradeoff until this actually
 * runs behind more than one process.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Periodically drop expired buckets so this map doesn't grow unbounded
// over a long-running dev server.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 5 * 60 * 1000).unref();

/**
 * Returns true if the action identified by `key` is allowed right now,
 * and records this attempt. `limit` attempts are allowed per `windowMs`.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) {
    return false;
  }

  bucket.count += 1;
  return true;
}
