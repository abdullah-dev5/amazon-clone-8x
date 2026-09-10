import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { recomputeProductRating } from "@/lib/reviews";
import { createReviewSchema } from "@/lib/validation/review";
import { parseRequestBody } from "@/lib/validation/helpers";
import { withApiErrorLogging } from "@/lib/api-error";

export const POST = withApiErrorLogging("POST /api/reviews", async (req: NextRequest) => {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = parseRequestBody(createReviewSchema, body);
  if (!parsed.success) return parsed.response;
  const { productId, rating, title, body: reviewBody } = parsed.data;

  const product = await db.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  // Courtesy check for a fast, friendly error in the common case — the
  // Review.productId_userId @@unique constraint is what actually
  // guarantees correctness under a concurrent duplicate submit, caught as
  // P2002 below (same pattern as signup's duplicate-email handling).
  const existing = await db.review.findUnique({
    where: { productId_userId: { productId, userId: user.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "You've already reviewed this product." }, { status: 409 });
  }

  try {
    const review = await db.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          productId,
          userId: user.id,
          authorName: user.name,
          rating,
          title,
          body: reviewBody,
        },
      });
      await recomputeProductRating(tx, productId);
      return created;
    });
    return NextResponse.json(review, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "You've already reviewed this product." }, { status: 409 });
    }
    throw err;
  }
});
