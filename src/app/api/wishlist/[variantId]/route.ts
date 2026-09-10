import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ variantId: string }> }
) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { variantId } = await params;
  const wishlist = await db.wishlist.findUnique({ where: { userId: user.id } });
  if (wishlist) {
    await db.wishlistItem
      .delete({ where: { wishlistId_variantId: { wishlistId: wishlist.id, variantId } } })
      .catch(() => undefined);
  }

  return NextResponse.json({ ok: true });
}
