import type { Prisma, PrismaClient } from "@prisma/client";

type DbClient = PrismaClient | Prisma.TransactionClient;

/**
 * Recomputes Product.rating/reviewCount from the actual Review rows for
 * that product, rather than incrementing/decrementing counters — so the
 * aggregate can never drift from reality regardless of how many reviews
 * are created, edited, or deleted. Call inside the same transaction as the
 * review write that triggered it.
 */
export async function recomputeProductRating(db: DbClient, productId: string) {
  const agg = await db.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: true,
  });
  await db.product.update({
    where: { id: productId },
    data: {
      rating: agg._avg.rating ?? 0,
      reviewCount: agg._count,
    },
  });
}
