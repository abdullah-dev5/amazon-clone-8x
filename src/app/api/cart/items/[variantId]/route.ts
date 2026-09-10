import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { getCartView, removeGuestItem, removeUserItem, updateGuestItem, updateUserItem } from "@/lib/cart";
import { db } from "@/lib/db";
import { updateCartItemSchema } from "@/lib/validation/cart";
import { parseRequestBody } from "@/lib/validation/helpers";
import { withApiErrorLogging } from "@/lib/api-error";

export const PATCH = withApiErrorLogging(
  "PATCH /api/cart/items/[variantId]",
  async (req: NextRequest, { params }: { params: Promise<{ variantId: string }> }) => {
    const { variantId } = await params;
    const body = await req.json().catch(() => null);
    const parsed = parseRequestBody(updateCartItemSchema, body);
    if (!parsed.success) return parsed.response;
    const { quantity } = parsed.data;

    const variant = await db.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) {
      return NextResponse.json({ error: "Product variant not found." }, { status: 404 });
    }

    const userId = await getSessionUserId();
    if (userId) {
      await updateUserItem(userId, variantId, quantity, variant.stock);
    } else {
      await updateGuestItem(variantId, quantity, variant.stock);
    }

    const cart = await getCartView(userId);
    return NextResponse.json(cart);
  }
);

export const DELETE = withApiErrorLogging(
  "DELETE /api/cart/items/[variantId]",
  async (_req: NextRequest, { params }: { params: Promise<{ variantId: string }> }) => {
    const { variantId } = await params;
    const userId = await getSessionUserId();
    if (userId) {
      await removeUserItem(userId, variantId);
    } else {
      await removeGuestItem(variantId);
    }

    const cart = await getCartView(userId);
    return NextResponse.json(cart);
  }
);
