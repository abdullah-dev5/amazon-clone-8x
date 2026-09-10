import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { setCheckoutState } from "@/lib/checkout";

function luhnValid(cardNumber: string) {
  const digits = cardNumber.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

export async function POST(req: NextRequest) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const cardholderName = typeof body?.cardholderName === "string" ? body.cardholderName.trim() : "";
  const cardNumber = typeof body?.cardNumber === "string" ? body.cardNumber : "";
  const expiry = typeof body?.expiry === "string" ? body.expiry : "";
  const cvv = typeof body?.cvv === "string" ? body.cvv : "";

  if (!cardholderName) {
    return NextResponse.json({ error: "Cardholder name is required." }, { status: 400 });
  }
  if (!luhnValid(cardNumber)) {
    return NextResponse.json({ error: "That card number doesn't look valid." }, { status: 400 });
  }
  const expiryMatch = /^(\d{2})\s*\/\s*(\d{2})$/.exec(expiry.trim());
  if (!expiryMatch) {
    return NextResponse.json({ error: "Expiry must be in MM/YY format." }, { status: 400 });
  }
  const month = Number(expiryMatch[1]);
  const year = 2000 + Number(expiryMatch[2]);
  if (month < 1 || month > 12) {
    return NextResponse.json({ error: "Invalid expiry month." }, { status: 400 });
  }
  const now = new Date();
  const expiryDate = new Date(year, month, 0);
  if (expiryDate < new Date(now.getFullYear(), now.getMonth(), 1)) {
    return NextResponse.json({ error: "This card has expired." }, { status: 400 });
  }
  if (!/^\d{3,4}$/.test(cvv)) {
    return NextResponse.json({ error: "Invalid security code." }, { status: 400 });
  }

  // Mock payment only — no full card number is stored or sent anywhere real,
  // just the last 4 digits for display on the order review step.
  const last4 = cardNumber.replace(/\D/g, "").slice(-4);
  await setCheckoutState({ paymentConfirmed: true, paymentLast4: last4 });
  return NextResponse.json({ ok: true, last4 });
}
