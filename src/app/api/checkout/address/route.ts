import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { setCheckoutState } from "@/lib/checkout";
import { db } from "@/lib/db";
import { addressSchema } from "@/lib/validation/address";
import { parseRequestBody } from "@/lib/validation/helpers";
import { withApiErrorLogging } from "@/lib/api-error";

export const POST = withApiErrorLogging("POST /api/checkout/address", async (req: NextRequest) => {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await req.json().catch(() => null);

  let addressId: string | undefined = typeof body?.addressId === "string" ? body.addressId : undefined;

  if (!addressId) {
    const parsed = parseRequestBody(addressSchema, body);
    if (!parsed.success) return parsed.response;
    const address = parsed.data;

    const created = await db.$transaction(async (tx) => {
      const existingCount = await tx.address.count({ where: { userId: user.id } });
      return tx.address.create({
        data: {
          userId: user.id,
          fullName: address.fullName,
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country ?? "US",
          phone: address.phone,
          isDefault: existingCount === 0,
        },
      });
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
});
