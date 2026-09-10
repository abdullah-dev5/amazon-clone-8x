import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getCartView } from "@/lib/cart";
import { setCheckoutState, clearCouponFromCheckoutState } from "@/lib/checkout";
import { validateCouponCode } from "@/lib/coupon";
import { computeDiscountCents } from "@/lib/pricing";
import { db } from "@/lib/db";
import { couponCodeSchema } from "@/lib/validation/coupon";
import { parseRequestBody } from "@/lib/validation/helpers";

export async function POST(req: NextRequest) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const codeParsed = parseRequestBody(couponCodeSchema, body?.code);
  if (!codeParsed.success) return codeParsed.response;

  const cart = await getCartView(user.id);
  if (cart.lines.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  const result = await validateCouponCode(db, codeParsed.data, cart.subtotalCents);
  if (!result.valid) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }

  await setCheckoutState({ couponCode: result.coupon.code });

  const discountCents = computeDiscountCents(cart.subtotalCents, result.coupon);
  return NextResponse.json({ code: result.coupon.code, discountCents });
}

export async function DELETE() {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  await clearCouponFromCheckoutState();
  return NextResponse.json({ ok: true });
}
