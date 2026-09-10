# Progress vs. Plan

Status as of commit `d6a487a` (2026-09-10). Compares actual state against
`PLAN.md`. Updated at milestones, not line-by-line with every commit — see
`git log` for the authoritative, incremental history.

## Summary

**The full P0 golden path is implemented, QA-regressed, and passing an
automated end-to-end test.** Most of P1 is also done. Nothing in P2 has been
built (as intended — it was explicitly deprioritized). A subsequent
hardening pass addressed idempotency, stock integrity, and race conditions
across order placement, cart mutations, signup, and address defaults — see
"Correctness/idempotency/security hardening" below.

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
2a3cc18  Add PLAN.md and PROGRESS.md documenting milestones and current status
d6a487a  Harden correctness, idempotency, and security per revised priority order
```

## Correctness / idempotency / security hardening

Following a revised priority order (core journey > correctness/integrity >
security > idempotency > engineering quality > UI/UX > testing >
deployment), a dedicated pass addressed several real gaps found by asking,
for each state-changing operation, "what happens if this is submitted
twice, or retried after the server processed it but the client didn't see
the response?":

- **Order placement is now atomic and idempotent.** Previously
  `place-order` did cart-read → order-create → cart-clear as separate,
  non-transactional steps with no protection against a double-click or
  retry creating two orders. Fixed with an `Order.idempotencyKey` (unique,
  derived from a per-checkout-session id generated once in
  `lib/checkout.ts` and stable across retries within that session) plus a
  `db.$transaction` wrapping stock re-validation, stock decrement, order +
  items creation, and cart-clear together. Verified under real concurrency:
  two literally-parallel requests both return the same order id, exactly
  one `Order` row is created, and stock is decremented exactly once.
- **Stock was never decremented on purchase** (an oversell bug) and was
  only enforced client-side (the quantity `<select>`'s cap) on add-to-cart,
  never server-side. Both are now fixed: purchase decrements stock inside
  the same transaction as order creation (rolling back the whole order,
  verified, if stock dropped below the cart's quantity in the meantime),
  and every cart-mutation path clamps against live stock server-side,
  reporting back to the UI when it had to.
- **Two more of the same class of bug, found by the same question, fixed
  the same way:** concurrent signups with the same email could both pass
  the pre-check and then hit an uncaught unique-constraint error (500) —
  now transactional with a caught, friendly 409. Concurrent "set address as
  default" requests could leave two addresses marked default — now
  transactional at all three call sites that touch it.
- **Rate limiting added** (`lib/rate-limit.ts`, in-memory — no Redis, matches
  the current single-process scope) on sign-in (10/15min, keyed by email —
  blocks brute-forcing a specific account) and sign-up (20/hour, keyed by
  IP, only once a real IP is available so it doesn't collapse local
  dev/test traffic into one bucket).
- **Optimistic UI updates without rollback** in `CartList`, `AddressBook`,
  and `WishlistList` could leave the UI showing a state the server never
  reached, if a mutation failed. All three now snapshot before mutating,
  roll back and surface an inline error on failure.

Re-verified after every change: `tsc --noEmit` clean, the golden-path
Playwright test passing, and zero unexpected server errors across an
extensive manual regression (concurrent order placement, simulated
stock-depletion race, rate-limit triggering/scoping, concurrent signup).

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

- Live deployment and hosted DB migration (explicitly deferred until the
  final phase per current instructions — local SQLite is acceptable for
  now; note it wouldn't survive Vercel's serverless filesystem as-is, so a
  real deploy needs a hosted DB swap first, deliberately not started).
- Related/recommended products on the PDP (P1, not done).
- Saved payment methods — still intentionally not built (see Deviations):
  no full card number is ever persisted, which is fundamentally at odds
  with a "saved cards" feature as originally scoped.
- Broader Playwright coverage beyond the one golden-path test (deliberately
  kept small per instructions — "avoid building a large E2E test suite at
  this stage"); the idempotency/race-condition fixes were verified manually
  (documented in git commit `d6a487a`) rather than via new automated tests.
- Structured request validation (e.g. zod) — API routes currently validate
  manually per-field; functional and exercised extensively, but a schema
  library would reduce repetition and the chance of a missed check as more
  routes are added.
- `npm audit` reports 3 high-severity advisories, all in Prisma's optional
  MySQL driver support (`mysql2`) and a transitive `deepmerge-ts`
  dependency — not reachable code paths for this app (SQLite-only), left
  as a known, low-real-risk item rather than force-downgrading Prisma.
