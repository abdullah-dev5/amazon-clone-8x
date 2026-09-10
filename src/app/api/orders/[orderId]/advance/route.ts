import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ADVANCE_TRANSITIONS } from "@/lib/order-status";

/**
 * Advances an order one step through PLACED -> PROCESSING -> SHIPPED ->
 * DELIVERED. There's no warehouse/carrier integration or background job in
 * this app — this is the small, ownership-gated, server-validated
 * mechanism used to move an order forward for demonstration/testing. Only
 * ever surfaced in the UI outside production (see the order detail page).
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { orderId } = await params;
  const order = await db.order.findFirst({ where: { id: orderId, userId: user.id } });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const next = ADVANCE_TRANSITIONS[order.status];
  if (!next) {
    return NextResponse.json(
      { error: `An order in ${order.status} status can't be advanced further.` },
      { status: 409 }
    );
  }

  const updated = await db.order.update({ where: { id: order.id }, data: { status: next } });
  return NextResponse.json({ status: updated.status });
}
