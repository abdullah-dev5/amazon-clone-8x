import { randomUUID } from "crypto";
import { cookies } from "next/headers";

const CHECKOUT_COOKIE = "checkout_state";

export type DeliveryOption = {
  id: string;
  label: string;
  etaLabel: string;
  priceCents: number;
};

export const DELIVERY_OPTIONS: DeliveryOption[] = [
  { id: "standard", label: "Standard Shipping", etaLabel: "5-7 business days", priceCents: 0 },
  { id: "expedited", label: "Expedited Shipping", etaLabel: "2-3 business days", priceCents: 999 },
  { id: "same-day", label: "Same-Day Delivery", etaLabel: "Today, by 9pm", priceCents: 1999 },
];

export type CheckoutState = {
  // Stable for the life of one checkout session; used as the Order's
  // idempotency key so a double-click or client retry of place-order can't
  // create two orders. Generated once, the first time state is set, and
  // naturally rotates on the next checkout because clearCheckoutState()
  // removes it.
  checkoutId?: string;
  addressId?: string;
  deliveryOptionId?: string;
  paymentConfirmed?: boolean;
  paymentLast4?: string;
  // The applied coupon code, if any — re-validated fresh against the live
  // cart on every read (review display, place-order), never trusted as a
  // cached discount amount. See lib/coupon.ts and lib/pricing.ts.
  couponCode?: string;
};

export async function getCheckoutState(): Promise<CheckoutState> {
  const store = await cookies();
  const raw = store.get(CHECKOUT_COOKIE)?.value;
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function setCheckoutState(patch: Partial<CheckoutState>) {
  const current = await getCheckoutState();
  const next = { checkoutId: current.checkoutId ?? randomUUID(), ...current, ...patch };
  const store = await cookies();
  store.set(CHECKOUT_COOKIE, JSON.stringify(next), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 2,
  });
  return next;
}

export async function clearCheckoutState() {
  const store = await cookies();
  store.delete(CHECKOUT_COOKIE);
}

export async function clearCouponFromCheckoutState() {
  const current = await getCheckoutState();
  const { couponCode: _removed, ...rest } = current;
  const store = await cookies();
  store.set(CHECKOUT_COOKIE, JSON.stringify(rest), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 2,
  });
}

export function getDeliveryOption(id: string | undefined) {
  return DELIVERY_OPTIONS.find((d) => d.id === id);
}
