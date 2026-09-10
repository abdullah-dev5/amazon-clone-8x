import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { getCartView, removeGuestItem, removeUserItem, updateGuestItem, updateUserItem } from "@/lib/cart";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ variantId: string }> }
) {
  const { variantId } = await params;
  const body = await req.json().catch(() => null);
  const quantity = Number.isInteger(body?.quantity) ? body.quantity : null;
  if (quantity === null) {
    return NextResponse.json({ error: "A valid quantity is required." }, { status: 400 });
  }

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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ variantId: string }> }
) {
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
