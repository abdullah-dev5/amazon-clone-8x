import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCartView } from "@/lib/cart";
import { clearCheckoutState, getCheckoutState, getDeliveryOption, TAX_RATE } from "@/lib/checkout";

export async function POST() {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const state = await getCheckoutState();
  if (!state.addressId || !state.deliveryOptionId || !state.paymentConfirmed) {
    return NextResponse.json({ error: "Checkout is incomplete." }, { status: 400 });
  }

  const address = await db.address.findFirst({ where: { id: state.addressId, userId: user.id } });
  const delivery = getDeliveryOption(state.deliveryOptionId);
  if (!address || !delivery) {
    return NextResponse.json({ error: "Checkout is incomplete." }, { status: 400 });
  }

  const cart = await getCartView(user.id);
  if (cart.lines.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  const subtotalCents = cart.subtotalCents;
  const shippingCents = delivery.priceCents;
  const taxCents = Math.round(subtotalCents * TAX_RATE);
  const totalCents = subtotalCents + shippingCents + taxCents;

  const order = await db.order.create({
    data: {
      userId: user.id,
      addressId: address.id,
      shipToName: address.fullName,
      shipToLine1: address.line1,
      shipToLine2: address.line2,
      shipToCity: address.city,
      shipToState: address.state,
      shipToPostalCode: address.postalCode,
      shipToCountry: address.country,
      deliveryOption: `${delivery.label} (${delivery.etaLabel})`,
      subtotalCents,
      shippingCents,
      taxCents,
      totalCents,
      items: {
        create: cart.lines.map((line) => ({
          variantId: line.variantId,
          productTitle: line.productTitle,
          variantName: line.variantName,
          imageUrl: line.imageUrl,
          unitPriceCents: line.unitPriceCents,
          quantity: line.quantity,
        })),
      },
    },
  });

  const dbCart = await db.cart.findUnique({ where: { userId: user.id } });
  if (dbCart) {
    await db.cartItem.deleteMany({ where: { cartId: dbCart.id } });
  }
  await clearCheckoutState();

  return NextResponse.json({ orderId: order.id });
}
