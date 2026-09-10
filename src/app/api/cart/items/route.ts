import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { addGuestItem, addUserItem, getCartView } from "@/lib/cart";
import { db } from "@/lib/db";
import { addCartItemSchema } from "@/lib/validation/cart";
import { parseRequestBody } from "@/lib/validation/helpers";
import { withApiErrorLogging } from "@/lib/api-error";

export const POST = withApiErrorLogging("POST /api/cart/items", async (req: NextRequest) => {
  const body = await req.json().catch(() => null);
  const parsed = parseRequestBody(addCartItemSchema, body);
  if (!parsed.success) return parsed.response;
  const { variantId, quantity } = parsed.data;

  const variant = await db.productVariant.findUnique({ where: { id: variantId } });
  if (!variant) {
    return NextResponse.json({ error: "Product variant not found." }, { status: 404 });
  }
  if (variant.stock < 1) {
    return NextResponse.json({ error: "This item is out of stock." }, { status: 409 });
  }

  const userId = await getSessionUserId();
  const result = userId
    ? await addUserItem(userId, variantId, quantity, variant.stock)
    : await addGuestItem(variantId, quantity, variant.stock);

  const cart = await getCartView(userId);
  return NextResponse.json({ ...cart, clamped: result.wasClamped });
});

export const GET = withApiErrorLogging("GET /api/cart/items", async () => {
  const userId = await getSessionUserId();
  const cart = await getCartView(userId);
  return NextResponse.json(cart);
});
