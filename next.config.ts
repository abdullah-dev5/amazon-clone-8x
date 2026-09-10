import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Real, category-relevant product photos pulled from public APIs at
    // seed time (see prisma/seed.ts) rather than random stock photography:
    // DummyJSON's product catalog for most products, Open Library's cover
    // API for books, and Wikipedia's pageimages API only for the 5 Toys &
    // Games products, where neither other source has anything toy-shaped
    // at all (their DummyJSON substitutes — a lamp, a plant pot — were
    // actively misleading, worse than the reliability tradeoff). Wikipedia
    // images are pre-warmed into Next's image cache at seed/deploy time
    // (see the warming note in PROGRESS.md) since its CDN rate-limits
    // per-IP tightly enough that an on-demand first load can occasionally
    // 429 — acceptable for 5 products with a warmed cache, not worth the
    // same risk across the other 39.
    remotePatterns: [
      { protocol: "https", hostname: "cdn.dummyjson.com" },
      { protocol: "https", hostname: "covers.openlibrary.org" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
    ],
  },
  // A small, standard set of response headers — not a full CSP/security
  // framework, just the low-risk defaults every production app should send.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
