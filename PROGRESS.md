# Progress vs. Plan

Status as of commit `f81420e` (2026-09-10). Compares actual state against
`PLAN.md`. Updated at milestones, not line-by-line with every commit — see
`git log` for the authoritative, incremental history.

## Summary

**The full P0 golden path is implemented, QA-regressed, and passing an
automated end-to-end test.** Most of P1 is also done. Nothing in P2 has been
built (as intended — it was explicitly deprioritized).

## Commit history

```
5c1bb7a  Set up automatic prompt/response capture for the 8x assignment
d1de05f  Scaffold Next.js (App Router, TS, Tailwind) project
3cfd96e  Add Prisma data layer, schema, and seed catalog
60340d5  Add auth, cart, and homepage — discovery + buy spine begins
1a93eae  Add search, category browse, and product detail pages
aec9867  Complete the P0 buy spine: cart, auth, and 4-step checkout
480cc4f  Add order history and order detail pages — P0 spine complete
d29c2b5  Add wishlist, address book management, and account home (P1)
f81420e  Release QA checkpoint: fix mobile header defect + form label a11y,
         add Playwright golden-path test
```

## P0 — status: DONE

| Item | Status |
|---|---|
| Homepage w/ seeded categories/grid | Done |
| Search + results + filter (category, price) + sort (price, rating) | Done |
| PDP w/ single-axis variant selector + add to cart | Done |
| Cart (qty update, remove, subtotal) | Done |
| Email/password sign-in + signup | Done |
| Checkout: address, delivery, payment (mocked), review | Done |
| Place order → confirmation page | Done |
| Order history list | Done |

Verified end-to-end via a full manual regression (guest cart → signup →
cart merge → checkout → duplicate-submission handling → confirmation →
order history, plus auth-gating, checkout step-gating, and cross-user order
access all correctly blocked) and an automated Playwright test
(`e2e/golden-path.spec.ts`), passing consistently.

## P1 — status: MOSTLY DONE

| Item | Status |
|---|---|
| Reviews & ratings (seeded, rating distribution) | Done |
| Wishlist | Done |
| Address book CRUD (add/set-default/delete, default reassignment) | Done |
| Order detail page | Done |
| "Buy Now" direct-checkout path | Done |
| Responsive polish pass | Done (see Defects below) |
| Empty/loading/error states | Done for the states that apply to this app's scope |
| Saved payment methods (multiple, persisted) | **Not done** — payment is intentionally never persisted (see Deviations) |
| Related/recommended products on PDP | **Not done** |

## P2 — status: NOT STARTED (as planned)

Nothing from P2 has been built. No scope creep occurred.

## Deviations from the plan

1. **shadcn/ui was skipped.** The plan recommended Tailwind + shadcn/ui.
   During setup this machine hit real resource constraints — a completely
   full C: drive (0 bytes free) and a JavaScript heap OOM crash during the
   first `npm install` attempt (system RAM dropped to ~600MB free at one
   point). After the user freed some disk space, installs were redirected
   to run off the E: drive (npm cache, temp, and Playwright's browser
   binaries all use `.npm-cache`/`.npm-tmp` under the repo, gitignored) to
   avoid repeating the failure. Given that fragility, the shadcn/ui CLI
   install was deliberately skipped in favor of hand-rolled Tailwind
   components — fewer moving parts, lower risk of another install failure.
   Visual quality is still reasonable; shadcn would have given more
   polished primitives (animated dropdowns, etc.).
2. **Prisma is pinned to 6.19.3, not latest.** The default `npm install`
   grabbed `prisma@8.0.0-rc.13` against `@prisma/client@7.10.0` — a broken
   cross-major pairing. Prisma 7 also removed `datasource { url }` from
   `schema.prisma` in favor of a driver-adapter config model. Rather than
   adopt an unfamiliar config system mid-build, both packages were pinned
   to the last stable v6 release.
3. **Saved payment methods were never implemented**, by design: no full
   card number is ever stored (Luhn-validated client-side, only last 4
   digits kept, in a short-lived cookie, purely for display on the review/
   confirmation screens). A "saved payment methods" feature would require
   persisting reusable card data, which conflicts with that choice. This
   was flagged as a P1 item in the plan but the security tradeoff was
   judged more important than the feature.
4. **Buy Now** goes straight to `/checkout/address` rather than all the way
   to review with a pre-filled saved address+payment (as the plan's journey
   2 originally imagined), because payment is never saved (see above) — so
   payment always requires a step regardless of entry point.

## Defects found and fixed during the QA checkpoint

1. **Mobile header: search input squeezed to ~24px wide, effectively
   unusable.** Root cause: only the search `<form>` had `min-w-0`; its flex
   siblings (account menu, cart icon) defaulted to `min-width: auto` and
   refused to shrink below their content size, so the browser shrank the
   search input instead to make everything fit in a 390px row. Fixed by
   giving the search bar its own full-width row on mobile (`order-last` +
   `w-full` inside a `flex-wrap` container) and grouping account/cart into
   a `shrink-0` cluster. Verified via Playwright `boundingBox()`
   measurement before (24px) and after (314px) the fix, and via screenshots
   at mobile/tablet/desktop widths.
2. **Broken label-to-input association in `AuthForm` and
   `PaymentStepForm`.** `<label>` elements had no `htmlFor`/`id` pairing
   with their inputs — invisible to screen readers, and the reason
   Playwright's `getByLabel` timed out while writing the golden-path test.
   Fixed with proper `htmlFor`/`id` pairs. `AddressStepForm` and
   `AddressBook` used placeholder-only inputs (no persistent label once
   text is entered); added `aria-label` to each as a minimal fix.

No other defects were found during the regression pass (auth gating,
checkout step-gating, cart math, duplicate-submission handling, cross-user
order access, guest-cart merge, address default-reassignment, and edge
cases — empty cart/wishlist, no search results, SQL-injection-shaped query,
invalid product/category/route/order — all behaved correctly on first
check). Zero server errors were logged across the entire QA session.

## What's left (not started)

- Live deployment (explicitly deferred — local-only was confirmed as
  sufficient for now; note SQLite's file-based DB wouldn't survive
  Vercel's serverless filesystem as-is, so a deploy would need a hosted DB
  swap first).
- Related/recommended products on the PDP (P1, not done).
- Broader Playwright coverage beyond the one golden-path test (deliberately
  kept small per instructions — "avoid building a large E2E test suite at
  this stage").
- `npm audit` reports 3 high-severity advisories, all in Prisma's optional
  MySQL driver support (`mysql2`) and a transitive `deepmerge-ts`
  dependency — not reachable code paths for this app (SQLite-only), left
  as a known, low-real-risk item rather than force-downgrading Prisma.
