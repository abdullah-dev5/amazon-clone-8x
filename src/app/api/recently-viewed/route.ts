import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recordProductView } from "@/lib/recently-viewed";
import { withApiErrorLogging } from "@/lib/api-error";

export const POST = withApiErrorLogging("POST /api/recently-viewed", async (req: NextRequest) => {
  const body = await req.json().catch(() => null);
  const productId = typeof body?.productId === "string" ? body.productId : "";
  if (!productId) {
    return NextResponse.json({ error: "A productId is required." }, { status: 400 });
  }

  // Cheap existence check so the cookie never accumulates IDs that were
  // never real products (defense against a client calling this directly
  // with arbitrary input).
  const exists = await db.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!exists) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  await recordProductView(productId);
  return NextResponse.json({ ok: true });
});
