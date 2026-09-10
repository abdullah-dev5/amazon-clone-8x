import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCartView } from "@/lib/cart";
import { getCheckoutState, getDeliveryOption, TAX_RATE } from "@/lib/checkout";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { CheckoutSteps } from "@/components/CheckoutSteps";
import { PlaceOrderButton } from "@/components/PlaceOrderButton";

export const dynamic = "force-dynamic";

export default async function CheckoutReviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/checkout/review");

  const state = await getCheckoutState();
  if (!state.addressId) redirect("/checkout/address");
  if (!state.deliveryOptionId) redirect("/checkout/delivery");
  if (!state.paymentConfirmed) redirect("/checkout/payment");

  const [address, cart] = await Promise.all([
    db.address.findFirst({ where: { id: state.addressId, userId: user.id } }),
    getCartView(user.id),
  ]);
  const delivery = getDeliveryOption(state.deliveryOptionId);

  if (!address || !delivery || cart.lines.length === 0) {
    redirect("/cart");
  }

  const subtotalCents = cart.subtotalCents;
  const shippingCents = delivery.priceCents;
  const taxCents = Math.round(subtotalCents * TAX_RATE);
  const totalCents = subtotalCents + shippingCents + taxCents;

  return (
    <div className="mx-auto max-w-4xl px-3 py-6">
      <CheckoutSteps current="review" />
      <h1 className="text-xl font-bold text-gray-900 mb-4">Review your order</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-300 p-4">
            <h2 className="font-semibold text-gray-900 mb-1">Shipping to</h2>
            <p className="text-sm text-gray-700">{address.fullName}</p>
            <p className="text-sm text-gray-700">
              {address.line1}
              {address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state}{" "}
              {address.postalCode}
            </p>
          </div>

          <div className="rounded-lg border border-gray-300 p-4">
            <h2 className="font-semibold text-gray-900 mb-1">Delivery</h2>
            <p className="text-sm text-gray-700">
              {delivery.label} — {delivery.etaLabel}
            </p>
          </div>

          <div className="rounded-lg border border-gray-300 p-4">
            <h2 className="font-semibold text-gray-900 mb-1">Payment</h2>
            <p className="text-sm text-gray-700">
              Card ending in {state.paymentLast4 ?? "****"}
            </p>
          </div>

          <div className="rounded-lg border border-gray-300 divide-y">
            {cart.lines.map((line) => (
              <div key={line.variantId} className="p-4 flex gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded bg-gray-100">
                  {line.imageUrl && (
                    <Image src={line.imageUrl} alt={line.productTitle} fill sizes="64px" className="object-cover" />
                  )}
                </div>
                <div className="flex-1 text-sm">
                  <p className="font-medium text-gray-900 line-clamp-2">{line.productTitle}</p>
                  <p className="text-gray-600">
                    {line.variantName} · Qty {line.quantity}
                  </p>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {formatPrice(line.unitPriceCents * line.quantity)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-gray-300 p-4 h-fit space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Items subtotal:</span>
            <span>{formatPrice(subtotalCents)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Shipping:</span>
            <span>{shippingCents === 0 ? "FREE" : formatPrice(shippingCents)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Estimated tax:</span>
            <span>{formatPrice(taxCents)}</span>
          </div>
          <div className="flex justify-between text-base font-bold border-t pt-2">
            <span>Order total:</span>
            <span className="text-red-700">{formatPrice(totalCents)}</span>
          </div>
          <div className="pt-2">
            <PlaceOrderButton />
          </div>
        </div>
      </div>
    </div>
  );
}
