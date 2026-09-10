import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { setCheckoutState } from "@/lib/checkout";
import { paymentSchema } from "@/lib/validation/payment";
import { parseRequestBody } from "@/lib/validation/helpers";

export async function POST(req: NextRequest) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = parseRequestBody(paymentSchema, body);
  if (!parsed.success) return parsed.response;

  // Mock payment only — no full card number is stored or sent anywhere real,
  // just the last 4 digits for display on the order review step.
  const last4 = parsed.data.cardNumber.slice(-4);
  await setCheckoutState({ paymentConfirmed: true, paymentLast4: last4 });
  return NextResponse.json({ ok: true, last4 });
}
