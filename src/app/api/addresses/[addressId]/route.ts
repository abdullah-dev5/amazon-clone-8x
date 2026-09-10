import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { addressSchema } from "@/lib/validation/address";
import { parseRequestBody } from "@/lib/validation/helpers";

const partialAddressSchema = addressSchema.partial();

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ addressId: string }> }
) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { addressId } = await params;
  const owned = await db.address.findFirst({ where: { id: addressId, userId: user.id } });
  if (!owned) return NextResponse.json({ error: "Address not found." }, { status: 404 });

  const body = await req.json().catch(() => null);

  if (body?.setDefault) {
    await db.$transaction([
      db.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } }),
      db.address.update({ where: { id: addressId }, data: { isDefault: true } }),
    ]);
    return NextResponse.json({ ok: true });
  }

  const parsed = parseRequestBody(partialAddressSchema, body);
  if (!parsed.success) return parsed.response;

  const updated = await db.address.update({
    where: { id: addressId },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ addressId: string }> }
) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { addressId } = await params;
  const owned = await db.address.findFirst({ where: { id: addressId, userId: user.id } });
  if (!owned) return NextResponse.json({ error: "Address not found." }, { status: 404 });

  await db.$transaction(async (tx) => {
    await tx.address.delete({ where: { id: addressId } });
    if (owned.isDefault) {
      const next = await tx.address.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });
      if (next) {
        await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
      }
    }
  });

  return NextResponse.json({ ok: true });
}
