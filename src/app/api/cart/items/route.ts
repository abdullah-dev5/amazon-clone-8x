import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { addGuestItem, addUserItem, getCartView } from "@/lib/cart";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const variantId = typeof body?.variantId === "string" ? body.variantId : "";
  const quantity = Number.isInteger(body?.quantity) ? body.quantity : 1;

  if (!variantId || quantity < 1) {
    return NextResponse.json({ error: "A valid variantId and quantity are required." }, { status: 400 });
  }

  const variant = await db.productVariant.findUnique({ where: { id: variantId } });
  if (!variant) {
    return NextResponse.json({ error: "Product variant not found." }, { status: 404 });
  }

  const userId = await getSessionUserId();
  if (userId) {
    await addUserItem(userId, variantId, quantity);
  } else {
    await addGuestItem(variantId, quantity);
  }

  const cart = await getCartView(userId);
  return NextResponse.json(cart);
}

export async function GET() {
  const userId = await getSessionUserId();
  const cart = await getCartView(userId);
  return NextResponse.json(cart);
}
