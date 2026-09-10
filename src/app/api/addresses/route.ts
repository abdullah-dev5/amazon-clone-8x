import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { addressSchema } from "@/lib/validation/address";
import { parseRequestBody } from "@/lib/validation/helpers";

export async function POST(req: NextRequest) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = parseRequestBody(addressSchema, body);
  if (!parsed.success) return parsed.response;
  const input = parsed.data;
  const requestedDefault = !!(body && typeof body === "object" && "isDefault" in body && body.isDefault);

  const address = await db.$transaction(async (tx) => {
    const existingCount = await tx.address.count({ where: { userId: user.id } });
    const makeDefault = existingCount === 0 || requestedDefault;

    if (makeDefault) {
      await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    }

    return tx.address.create({
      data: {
        userId: user.id,
        fullName: input.fullName,
        line1: input.line1,
        line2: input.line2,
        city: input.city,
        state: input.state,
        postalCode: input.postalCode,
        country: input.country ?? "US",
        phone: input.phone,
        isDefault: makeDefault,
      },
    });
  });

  return NextResponse.json(address);
}
