import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { withApiErrorLogging } from "@/lib/api-error";

async function getOrCreateWishlist(userId: string) {
  const existing = await db.wishlist.findUnique({ where: { userId } });
  if (existing) return existing;
  return db.wishlist.create({ data: { userId } });
}

export const POST = withApiErrorLogging("POST /api/wishlist", async (req: NextRequest) => {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const variantId = typeof body?.variantId === "string" ? body.variantId : "";
  if (!variantId) {
    return NextResponse.json({ error: "A variantId is required." }, { status: 400 });
  }

  const variant = await db.productVariant.findUnique({ where: { id: variantId } });
  if (!variant) {
    return NextResponse.json({ error: "Product variant not found." }, { status: 404 });
  }

  const wishlist = await getOrCreateWishlist(user.id);
  await db.wishlistItem.upsert({
    where: { wishlistId_variantId: { wishlistId: wishlist.id, variantId } },
    create: { wishlistId: wishlist.id, variantId },
    update: {},
  });

  return NextResponse.json({ ok: true });
});
