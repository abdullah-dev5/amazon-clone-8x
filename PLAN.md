# Amazon Core Shopping Experience — Reconstruction Plan

> This is the recon + planning document produced and approved before any
> implementation started. It is preserved as-written (not updated after the
> fact) so the original milestones stay visible. See `PROGRESS.md` for what
> has actually been built and how it compares.

## Context

The repo started empty (no existing code). The ask is a from-scratch,
production-quality rebuild of Amazon.com's *core shopping experience* — not
the full Amazon platform, just discovery through post-purchase. This
document is the recon + planning pass required before any implementation
starts: map the real product, inventory the entities and screens, prioritize
ruthlessly for a short build window, and propose an architecture — then stop
and get approval.

**Methodology note:** Live browsing of amazon.com (homepage, search results,
cart) via automated fetch was attempted to ground this in the actual current
site rather than memory. Every attempt returned HTTP 503 — Amazon's anti-bot
layer blocks non-browser automated traffic outright, and no real
browser-control tool was available in that environment (only a headless
fetcher and web search, no screenshot capability). Targeted web searches
supplemented this, confirming current terminology (e.g. "Buy Box" formally
renamed "Featured Offer") and structural details (parent/child ASIN variant
model) against Amazon's own seller documentation. Everything else is built
from direct, detailed familiarity with Amazon's customer-facing UX — one of
the most stable, widely used, and widely studied e-commerce flows in
existence.

**Open assumption flagged at the time:** the brief said "10-hour product
reconstruction" in the opening line but "24-hour build" in the
prioritization section. 10 hours was treated as the real budget, with the
24-hour framing used only as the outer envelope for P1 stretch scope — P0
was sized to be achievable in ~10 focused hours.

---

## A. Product Map

Amazon's core shopping experience is a single linear spine (discover →
decide → buy → track) with three supporting subsystems hanging off it:

```
                     ┌─────────────┐
                     │  Discovery  │  Homepage, nav/categories, search, results
                     └──────┬──────┘
                            ▼
                     ┌─────────────┐
                     │   Decide    │  Product detail, variants, reviews
                     └──────┬──────┘
                            ▼
                     ┌─────────────┐
                     │     Buy     │  Cart → sign-in → address → delivery →
                     │             │  payment → review → confirm
                     └──────┬──────┘
                            ▼
                     ┌─────────────┐
                     │    Track    │  Order history, order detail
                     └─────────────┘

  Supporting subsystems (cut across the spine, not a stage of it):
   - Identity: sign in/up, address book, saved payment methods
   - Saved-for-later: wishlist / "save for later" in cart
   - Cross-cutting UI: header (search+cart+account, present everywhere),
     mega-menu nav, empty/error/loading states
```

## B. Primary User Journeys

1. **New/guest visitor, search-driven:** homepage → search → results
   (filter/sort) → product detail → add to cart → cart → prompted to sign in
   at checkout → creates account inline → address → delivery → payment →
   review → confirmation.
2. **Returning signed-in user, direct-to-buy:** homepage (or direct nav to a
   category) → product detail → selects a variant → "Buy Now" → skips cart,
   goes straight into checkout.
3. **Comparison shopper:** category nav → results grid → filters by
   price/rating → opens several PDPs in sequence → adds one to wishlist to
   decide later → returns via account → wishlist → moves item to cart →
   checkout.
4. **Post-purchase check-in:** signs in → account → order history → opens a
   specific past order → views status/items.

## C. Screen / Page Inventory

| # | Route (proposed) | Screen |
|---|---|---|
| 1 | `/` | Homepage |
| 2 | `/s?k=...` | Search results |
| 3 | `/c/[category]` | Category browse |
| 4 | `/product/[slug]` | Product detail |
| 5 | `/cart` | Cart |
| 6 | `/signin`, `/signup` | Auth |
| 7 | `/checkout/address` | Address select/add |
| 8 | `/checkout/delivery` | Delivery option select |
| 9 | `/checkout/payment` | Payment (mocked) |
| 10 | `/checkout/review` | Order review + place order |
| 11 | `/checkout/confirmation/[orderId]` | Order confirmation |
| 12 | `/account/orders` | Order history |
| 13 | `/account/orders/[orderId]` | Order detail |
| 14 | `/account/addresses` | Address book management |
| 15 | `/account/wishlist` | Wishlist |
| 16 | `/account` | Account home / settings |

Cross-cutting, not standalone routes: header (search bar, deliver-to,
account menu, cart badge) and footer, present on every page; toast/empty/
error/loading states.

## D. Core Entities & Relationships

```
User ──1:N── Address
User ──1:N── PaymentMethod
User ──1:1── Cart ──1:N── CartItem ──N:1── ProductVariant
User ──1:N── Order ──1:N── OrderItem ──N:1── ProductVariant
                Order ──N:1── Address (shipping snapshot)
User ──1:N── Review ──N:1── Product
User ──1:1── Wishlist ──1:N── WishlistItem ──N:1── ProductVariant
Category ──1:N── Product ──1:N── ProductVariant
```

- **Product** = the listing (title, description, images, category, base
  rating). **ProductVariant** = the actual purchasable SKU (one option axis
  for P0, e.g. color; price/stock live here, not on Product).
- **Order/OrderItem** snapshot price and address at purchase time (never
  live-join back to mutable Product/Address rows) — the one piece of "real"
  backend correctness worth getting right, since it's what makes order
  history trustworthy.
- **Cart** persists per signed-in user; a guest cart is cookie-backed until
  sign-in, then merges into the user's server cart.

## E. Critical Interaction / State Requirements

- Cart badge count stays in sync everywhere the header renders — single
  source of truth (server cart for signed-in, cookie state for guest).
- Checkout is resumable and consistent across 4 steps without losing
  selections on refresh — one server-side in-progress checkout state being
  filled in, not client-only multi-step form state.
- Guest → signed-in cart merge at the sign-in-during-checkout point —
  silent merge, no data loss, no duplicate line items.
- Order snapshotting — address/price at time of purchase must not drift if
  the user later edits their address book or a product's price changes.
- Auth-gated routes redirect to `/signin` and return the user to where they
  were after sign-in.
- Variant selection updates price/image/stock/availability in place on the
  PDP without a full page reload.

## F. P0 / P1 / P2 Prioritization (10h real budget, 24h stretch envelope)

**P0 — the whole spine must work end-to-end, or nothing else matters:**
homepage with seeded categories/grid · search + results + basic filter
(category, price range) + sort (price, rating) · PDP with one variant axis +
add to cart · cart (qty update, remove, subtotal) · simple email/password
sign-in+signup · checkout: address (add/select), delivery (static options),
payment (mocked form), review, place order · confirmation page · order
history list.

**P1 — do these if P0 lands with time left:** reviews & ratings (seeded,
read-only, rating distribution) · wishlist · address book CRUD (multiple
addresses, edit/delete, default) · saved payment methods · order detail page
· "Buy Now" direct-checkout path · related/recommended products on PDP ·
responsive polish pass · basic empty/loading/error states everywhere.

**P2 — explicit stretch, likely cut:** user-submitted reviews · second
variant axis · order status simulation beyond a static label · category
mega-menu · account settings/profile edit · search-as-you-type suggestions.

## G. Recommended Technical Architecture

Single deployable full-stack TypeScript app:

- **Framework:** Next.js (App Router).
- **Language:** TypeScript everywhere.
- **UI:** Tailwind CSS + shadcn/ui components (as originally recommended —
  see `PROGRESS.md` for a deviation taken here due to environment
  constraints).
- **Data:** Prisma ORM over SQLite (file-based, zero provisioning, trivial
  `seed.ts`).
- **State:** server-driven by default (RSC + route handlers); a small
  client store (Zustand) only for cart badge / ephemeral UI.
- **Auth:** email+password, hashed (bcrypt), signed session cookie — no
  real OAuth providers, no email verification.
- **Payment:** front-end-only mock card form (Luhn-validated), never
  transmitted anywhere real; order is always accepted.
- **Images:** curated set of stable stock/placeholder image URLs in seed
  data; no upload flow.
- **Search:** naive SQL `contains`/`LIKE` over the seeded catalog.
- **Testing:** a handful of Playwright end-to-end tests over broad unit
  coverage, given the time budget.
- **Deployment:** Vercel if a live URL is wanted; otherwise `npm run dev` +
  seed script.

## H. Proposed Repository Structure

```
/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/                 # routes per the screen inventory above
│   ├── components/          # shared UI
│   ├── lib/                 # db client, auth helpers, cart logic
│   └── types/
├── e2e/                      # Playwright golden-path tests
├── .agent-logs/              # prompt/response capture (8x assignment)
└── .claude/
```

## I. Major Risks & Time Sinks

- Checkout state across 4 steps is the classic time sink — mitigated by
  modeling it server-side as one in-progress checkout state, not client
  form state.
- Variant modeling is deceptively fiddly — hard cap at one axis for P0.
- Seed data quality has outsized leverage on perceived production quality
  relative to engineering time.
- Auth/session plumbing (route protection, redirect-back-after-signin,
  guest cart merge) is boilerplate-heavy in any framework.
- Reviews UI is an easy over-invest trap — keep to seeded/static for P1.
- Responsive PDP layout takes more CSS iteration than it looks like it
  should.

## J. Deliberately Out of Scope

Real payment gateway/PCI-scope card handling · third-party seller
marketplace/multi-offer buy box · Prime membership logic, subscribe & save,
gift cards, coupons/promo engine · real email/SMS notifications · live
chat/customer service · ML-driven recommendations or "frequently bought
together" · search autocomplete/typeahead · voice search, AR "view in
room," Alexa integration · live multi-warehouse inventory · dynamic/
countdown deal pricing · social/OAuth login · CAPTCHA/bot defenses ·
seller/admin dashboard · i18n/multi-currency · native mobile app.

---

## Proposed Implementation Plan (as approved)

1. **Scaffold** — Next.js + TS + Tailwind (+ shadcn/ui) project; Prisma +
   SQLite wired up; base layout.
2. **Data layer** — Prisma schema for the entities in section D; seed
   script generating ~40-80 products across 6-8 categories with variants
   and reviews.
3. **Discovery** — homepage, search, category browse with filter + sort.
4. **Decide** — product detail page: variant selector, reviews.
5. **Buy** — cart → auth (guest cart merge on login) → checkout → place
   order → confirmation.
6. **Track** — account/orders list + order detail page.
7. **P1 pass** (time permitting) — wishlist, address book CRUD, saved
   payment methods, "Buy Now" direct path, responsive polish, empty/error
   states.
8. **Verification** — Playwright golden-path test; manual pass through
   every P0 screen.
9. Commit incrementally throughout, not in one dump at the end.
