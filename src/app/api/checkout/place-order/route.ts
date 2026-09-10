import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCartView } from "@/lib/cart";
import { clearCheckoutState, getCheckoutState, getDeliveryOption } from "@/lib/checkout";
import { validateCouponCode } from "@/lib/coupon";
import { computeOrderTotals } from "@/lib/pricing";
import { withApiErrorLogging } from "@/lib/api-error";

class InsufficientStockError extends Error {
  constructor(productTitle: string, variantName: string) {
    super(`Sorry, "${productTitle} (${variantName})" no longer has enough stock for the quantity in your cart.`);
    this.name = "InsufficientStockError";
  }
}

export const POST = withApiErrorLogging("POST /api/checkout/place-order", async () => {
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
    // An empty cart here isn't necessarily "nothing to buy" — a
    // concurrent request for this exact checkout session may have already
    // committed its transaction (which clears the cart) in the gap
    // between the idempotency check above and this read. Check once more
    // before reporting an error a customer would see despite their order
    // having actually gone through.
    const raceWinner = await db.order.findUnique({ where: { idempotencyKey: state.checkoutId } });
    if (raceWinner) {
      return NextResponse.json({ orderId: raceWinner.id });
    }
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  try {
    const orderId = await db.$transaction(async (tx) => {
      // Re-validate stock AND price against the live row inside the
      // transaction — the cart view read above can be stale by the time
      // this commits. This is the operation that actually commits
      // inventory and money, not the earlier add-to-cart.
      let subtotalCents = 0;
      const itemsData: {
        variantId: string;
        productTitle: string;
        variantName: string;
        imageUrl: string | null;
        unitPriceCents: number;
        quantity: number;
      }[] = [];
      for (const line of cart.lines) {
        const variant = await tx.productVariant.findUniqueOrThrow({ where: { id: line.variantId } });

        // The stock check and the decrement must happen as a single atomic
        // conditional UPDATE, not a separate read-then-write — under
        // Postgres's default READ COMMITTED isolation, two concurrent
        // transactions can both read the same not-yet-decremented stock
        // value before either commits, both pass a plain `if` check, and
        // both decrement, overselling. A WHERE clause on the UPDATE itself
        // is what actually serializes this: Postgres takes a row lock to
        // evaluate and apply the WHERE + SET together, so a second
        // concurrent UPDATE on the same row blocks until the first
        // commits or rolls back, then re-evaluates against the real
        // post-commit value. (This bug was invisible under SQLite, which
        // serializes concurrent writes via its own file-level locking
        // regardless of application logic — confirmed by testing this
        // exact scenario against a real Postgres database, where it
        // reproduced consistently before this fix.)
        const decremented = await tx.productVariant.updateMany({
          where: { id: line.variantId, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        });
        if (decremented.count === 0) {
          throw new InsufficientStockError(line.productTitle, line.variantName);
        }
        subtotalCents += variant.priceCents * line.quantity;
        itemsData.push({
          variantId: line.variantId,
          productTitle: line.productTitle,
          variantName: line.variantName,
          imageUrl: line.imageUrl,
          unitPriceCents: variant.priceCents,
          quantity: line.quantity,
        });
      }

      // Same re-validation as the review page's preview, run again here
      // against the live subtotal — never trust the earlier apply-coupon
      // call's result. An invalid/expired/no-longer-qualifying coupon
      // simply contributes no discount rather than blocking the order.
      const couponResult = state.couponCode
        ? await validateCouponCode(tx, state.couponCode, subtotalCents)
        : null;
      const coupon = couponResult?.valid ? couponResult.coupon : null;

      const shippingCents = delivery.priceCents;
      const { discountCents, taxCents, totalCents } = computeOrderTotals({
        subtotalCents,
        shippingCents,
        coupon,
      });

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
          couponCode: coupon?.code ?? null,
          discountCents,
          subtotalCents,
          shippingCents,
          taxCents,
          totalCents,
          items: { create: itemsData },
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
});
