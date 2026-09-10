import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { addUserItem, getCartView } from "@/lib/cart";
import { withApiErrorLogging } from "@/lib/api-error";

type BuyAgainResult = {
  added: { productTitle: string; quantity: number }[];
  unavailable: { productTitle: string; reason: string }[];
};

/**
 * Re-adds a past order's items to the signed-in user's cart at CURRENT
 * price and stock — never the order's historical unitPriceCents. Reuses
 * the same addUserItem() mutation (and its own stock clamping/transaction)
 * that every other add-to-cart path already goes through; this route just
 * loops it over an order's items and reports what could and couldn't be
 * re-added, since a partial result is the expected, normal outcome here.
 */
export const POST = withApiErrorLogging(
  "POST /api/orders/[orderId]/buy-again",
  async (_req: Request, { params }: { params: Promise<{ orderId: string }> }) => {
    const user = await requireUser().catch(() => null);
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

    const { orderId } = await params;
    const order = await db.order.findFirst({
      where: { id: orderId, userId: user.id },
      include: { items: true },
    });
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    const result: BuyAgainResult = { added: [], unavailable: [] };

    for (const item of order.items) {
      if (!item.variantId) {
        result.unavailable.push({ productTitle: item.productTitle, reason: "No longer available" });
        continue;
      }
      const variant = await db.productVariant.findUnique({ where: { id: item.variantId } });
      if (!variant) {
        result.unavailable.push({ productTitle: item.productTitle, reason: "No longer available" });
        continue;
      }
      if (variant.stock < 1) {
        result.unavailable.push({ productTitle: item.productTitle, reason: "Out of stock" });
        continue;
      }
      await addUserItem(user.id, variant.id, item.quantity, variant.stock);
      result.added.push({ productTitle: item.productTitle, quantity: Math.min(item.quantity, variant.stock) });
    }

    const cart = await getCartView(user.id);
    return NextResponse.json({ ...result, itemCount: cart.itemCount });
  }
);
