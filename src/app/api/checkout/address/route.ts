import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { setCheckoutState } from "@/lib/checkout";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await req.json().catch(() => null);

  let addressId: string | undefined = typeof body?.addressId === "string" ? body.addressId : undefined;

  if (!addressId) {
    const required = ["fullName", "line1", "city", "state", "postalCode"];
    for (const field of required) {
      if (typeof body?.[field] !== "string" || !body[field].trim()) {
        return NextResponse.json({ error: `${field} is required.` }, { status: 400 });
      }
    }
    const existingCount = await db.address.count({ where: { userId: user.id } });
    const created = await db.address.create({
      data: {
        userId: user.id,
        fullName: body.fullName.trim(),
        line1: body.line1.trim(),
        line2: body.line2?.trim() || null,
        city: body.city.trim(),
        state: body.state.trim(),
        postalCode: body.postalCode.trim(),
        country: body.country?.trim() || "US",
        phone: body.phone?.trim() || null,
        isDefault: existingCount === 0,
      },
    });
    addressId = created.id;
  } else {
    const owned = await db.address.findFirst({ where: { id: addressId, userId: user.id } });
    if (!owned) {
      return NextResponse.json({ error: "Address not found." }, { status: 404 });
    }
  }

  await setCheckoutState({ addressId });
  return NextResponse.json({ addressId });
}
