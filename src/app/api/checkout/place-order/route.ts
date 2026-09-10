import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCartView } from "@/lib/cart";
import { clearCheckoutState, getCheckoutState, getDeliveryOption, TAX_RATE } from "@/lib/checkout";

class InsufficientStockError extends Error {
  constructor(productTitle: string, variantName: string) {
    super(`Sorry, "${productTitle} (${variantName})" no longer has enough stock for the quantity in your cart.`);
    this.name = "InsufficientStockError";
  }
}

export async function POST() {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const state = await getCheckoutState();
  if (!state.checkoutId || !state.addressId || !state.deliveryOptionId || !state.paymentConfirmed) {
    return NextResponse.json({ error: "Checkout is incomplete." }, { status: 400 });
  }

  // Idempotent replay: if this checkout session already produced an order —
  // a double-click, or this request retrying after an earlier one
  // committed but the response was lost — return that order instead of
  // creating a second one.
  const existing = await db.order.findUnique({ where: { idempotencyKey: state.checkoutId } });
  if (existing) {
    return NextResponse.json({ orderId: existing.id });
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

  try {
    const orderId = await db.$transaction(async (tx) => {
      // Re-validate and decrement stock against the live row inside the
      // transaction — the cart view read above can be stale by the time
      // this commits, and this is the operation that actually commits
      // inventory, not the earlier add-to-cart.
      for (const line of cart.lines) {
        const variant = await tx.productVariant.findUniqueOrThrow({ where: { id: line.variantId } });
        if (variant.stock < line.quantity) {
          throw new InsufficientStockError(line.productTitle, line.variantName);
        }
        await tx.productVariant.update({
          where: { id: line.variantId },
          data: { stock: { decrement: line.quantity } },
        });
      }

      const order = await tx.order.create({
        data: {
          userId: user.id,
          idempotencyKey: state.checkoutId!,
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

      const dbCart = await tx.cart.findUnique({ where: { userId: user.id } });
      if (dbCart) {
        await tx.cartItem.deleteMany({ where: { cartId: dbCart.id } });
      }

      return order.id;
    });

    await clearCheckoutState();
    return NextResponse.json({ orderId });
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      // Lost the race to a concurrent request for the same checkout
      // session — that one's order is the real one.
      const winner = await db.order.findUnique({ where: { idempotencyKey: state.checkoutId } });
      if (winner) {
        await clearCheckoutState();
        return NextResponse.json({ orderId: winner.id });
      }
    }
    throw err;
  }
}
