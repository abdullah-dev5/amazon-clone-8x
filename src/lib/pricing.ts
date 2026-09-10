/**
 * Single source of truth for order-total math. Used identically by the
 * checkout review page (display), the apply-coupon route (discount
 * preview), and place-order (authoritative, inside the order-creation
 * transaction) — so there is exactly one place that decides what a coupon
 * is worth and how tax/total are derived, never three independently
 * duplicated copies of the same formula.
 */

export const TAX_RATE = 0.08;

export type CouponInfo = {
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
};

/** Cents, clamped so a discount can never exceed the subtotal it applies to. */
export function computeDiscountCents(subtotalCents: number, coupon: CouponInfo | null): number {
  if (!coupon) return 0;
  const raw = coupon.type === "PERCENT" ? Math.round(subtotalCents * (coupon.value / 100)) : coupon.value;
  return Math.max(0, Math.min(raw, subtotalCents));
}

export function computeOrderTotals(params: {
  subtotalCents: number;
  shippingCents: number;
  coupon: CouponInfo | null;
}): { discountCents: number; taxCents: number; totalCents: number } {
  const discountCents = computeDiscountCents(params.subtotalCents, params.coupon);
  // Tax on the post-discount amount — a customer shouldn't pay tax on a
  // discount they actually received.
  const taxableCents = params.subtotalCents - discountCents;
  const taxCents = Math.round(taxableCents * TAX_RATE);
  const totalCents = taxableCents + params.shippingCents + taxCents;
  return { discountCents, taxCents, totalCents };
}
