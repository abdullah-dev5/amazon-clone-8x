import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

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
    await db.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    await db.address.update({ where: { id: addressId }, data: { isDefault: true } });
    return NextResponse.json({ ok: true });
  }

  const updated = await db.address.update({
    where: { id: addressId },
    data: {
      fullName: typeof body?.fullName === "string" ? body.fullName.trim() : undefined,
      line1: typeof body?.line1 === "string" ? body.line1.trim() : undefined,
      line2: typeof body?.line2 === "string" ? body.line2.trim() || null : undefined,
      city: typeof body?.city === "string" ? body.city.trim() : undefined,
      state: typeof body?.state === "string" ? body.state.trim() : undefined,
      postalCode: typeof body?.postalCode === "string" ? body.postalCode.trim() : undefined,
      phone: typeof body?.phone === "string" ? body.phone.trim() || null : undefined,
    },
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

  await db.address.delete({ where: { id: addressId } });

  if (owned.isDefault) {
    const next = await db.address.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });
    if (next) {
      await db.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  }

  return NextResponse.json({ ok: true });
}
