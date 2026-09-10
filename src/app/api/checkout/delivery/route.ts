import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getDeliveryOption, setCheckoutState } from "@/lib/checkout";

export async function POST(req: NextRequest) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const deliveryOptionId = typeof body?.deliveryOptionId === "string" ? body.deliveryOptionId : "";
  const option = getDeliveryOption(deliveryOptionId);
  if (!option) {
    return NextResponse.json({ error: "Invalid delivery option." }, { status: 400 });
  }

  await setCheckoutState({ deliveryOptionId });
  return NextResponse.json({ deliveryOptionId });
}
