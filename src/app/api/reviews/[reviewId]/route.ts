import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { recomputeProductRating } from "@/lib/reviews";
import { updateReviewSchema } from "@/lib/validation/review";
import { parseRequestBody } from "@/lib/validation/helpers";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { reviewId } = await params;
  const owned = await db.review.findFirst({ where: { id: reviewId, userId: user.id } });
  if (!owned) return NextResponse.json({ error: "Review not found." }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = parseRequestBody(updateReviewSchema, body);
  if (!parsed.success) return parsed.response;
  const { rating, title, body: reviewBody } = parsed.data;

  try {
    const updated = await db.$transaction(async (tx) => {
      const review = await tx.review.update({
        where: { id: reviewId },
        data: { rating, title, body: reviewBody },
      });
      await recomputeProductRating(tx, owned.productId);
      return review;
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH /api/reviews/[reviewId]: unexpected error", err);
    return NextResponse.json({ error: "Something went wrong updating your review." }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { reviewId } = await params;
  const owned = await db.review.findFirst({ where: { id: reviewId, userId: user.id } });
  if (!owned) return NextResponse.json({ error: "Review not found." }, { status: 404 });

  try {
    await db.$transaction(async (tx) => {
      await tx.review.delete({ where: { id: reviewId } });
      await recomputeProductRating(tx, owned.productId);
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/reviews/[reviewId]: unexpected error", err);
    return NextResponse.json({ error: "Something went wrong deleting your review." }, { status: 500 });
  }
}
