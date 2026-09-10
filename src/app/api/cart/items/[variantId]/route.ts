import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { getCartView, removeGuestItem, removeUserItem, updateGuestItem, updateUserItem } from "@/lib/cart";

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

  const userId = await getSessionUserId();
  if (userId) {
    await updateUserItem(userId, variantId, quantity);
  } else {
    await updateGuestItem(variantId, quantity);
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
