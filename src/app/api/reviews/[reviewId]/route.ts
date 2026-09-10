import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { recomputeProductRating } from "@/lib/reviews";
import { updateReviewSchema } from "@/lib/validation/review";
import { parseRequestBody } from "@/lib/validation/helpers";
import { withApiErrorLogging } from "@/lib/api-error";

export const PATCH = withApiErrorLogging(
  "PATCH /api/reviews/[reviewId]",
  async (req: NextRequest, { params }: { params: Promise<{ reviewId: string }> }) => {
    const user = await requireUser().catch(() => null);
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

    const { reviewId } = await params;
    const owned = await db.review.findFirst({ where: { id: reviewId, userId: user.id } });
    if (!owned) return NextResponse.json({ error: "Review not found." }, { status: 404 });

    const body = await req.json().catch(() => null);
    const parsed = parseRequestBody(updateReviewSchema, body);
    if (!parsed.success) return parsed.response;
    const { rating, title, body: reviewBody } = parsed.data;

    const updated = await db.$transaction(async (tx) => {
      const review = await tx.review.update({
        where: { id: reviewId },
        data: { rating, title, body: reviewBody },
      });
      await recomputeProductRating(tx, owned.productId);
      return review;
    });
    return NextResponse.json(updated);
  }
);

export const DELETE = withApiErrorLogging(
  "DELETE /api/reviews/[reviewId]",
  async (_req: NextRequest, { params }: { params: Promise<{ reviewId: string }> }) => {
    const user = await requireUser().catch(() => null);
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

    const { reviewId } = await params;
    const owned = await db.review.findFirst({ where: { id: reviewId, userId: user.id } });
    if (!owned) return NextResponse.json({ error: "Review not found." }, { status: 404 });

    await db.$transaction(async (tx) => {
      await tx.review.delete({ where: { id: reviewId } });
      await recomputeProductRating(tx, owned.productId);
    });
    return NextResponse.json({ ok: true });
  }
);
