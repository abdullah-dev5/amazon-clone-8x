import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const required = ["fullName", "line1", "city", "state", "postalCode"];
  for (const field of required) {
    if (typeof body?.[field] !== "string" || !body[field].trim()) {
      return NextResponse.json({ error: `${field} is required.` }, { status: 400 });
    }
  }

  const address = await db.$transaction(async (tx) => {
    const existingCount = await tx.address.count({ where: { userId: user.id } });
    const makeDefault = existingCount === 0 || !!body.isDefault;

    if (makeDefault) {
      await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    }

    return tx.address.create({
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
        isDefault: makeDefault,
      },
    });
  });

  return NextResponse.json(address);
}
