import { db } from "@/lib/db";
import type { ProductCardData } from "@/components/ProductCard";

export type SortOption = "relevance" | "price-asc" | "price-desc" | "rating-desc";

export type ProductQuery = {
  q?: string;
  categorySlug?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  sort?: SortOption;
};

function effectivePrice(variants: { priceCents: number; compareAtCents: number | null; isDefault: boolean }[]) {
  return variants.find((v) => v.isDefault)?.priceCents ?? variants[0]?.priceCents ?? 0;
}

type ProductWithVariants = {
  slug: string;
  title: string;
  rating: number;
  reviewCount: number;
  images: string;
  variants: { priceCents: number; compareAtCents: number | null; imageUrl: string | null; isDefault: boolean }[];
};

/** Single source of truth for Product -> card mapping, reused by every list view. */
export function toProductCardData(product: ProductWithVariants): ProductCardData {
  const defaultVariant = product.variants.find((v) => v.isDefault) ?? product.variants[0];
  const images: string[] = JSON.parse(product.images);
  return {
    slug: product.slug,
    title: product.title,
    rating: product.rating,
    reviewCount: product.reviewCount,
    imageUrl: defaultVariant?.imageUrl ?? images[0],
    priceCents: defaultVariant?.priceCents ?? 0,
    compareAtCents: defaultVariant?.compareAtCents ?? null,
  };
}

/**
 * Same category, excluding the current product. No ML, no separate
 * recommendation table — a bounded, indexed query is the right amount of
 * "recommendation engine" for this app.
 */
export async function getRelatedProducts(
  product: { id: string; categoryId: string },
  limit = 8
): Promise<ProductCardData[]> {
  const products = await db.product.findMany({
    where: { categoryId: product.categoryId, id: { not: product.id } },
    include: { variants: true },
    orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
    take: limit,
  });
  return products.map(toProductCardData);
}

/**
 * Resolves a most-recent-first list of product IDs (from the
 * recently-viewed cookie) against live product data, preserving that order
 * and silently dropping any ID for a product that no longer exists.
 * `findMany({ id: { in } })` does not preserve input order, so we remap.
 */
export async function getRecentlyViewedProducts(productIds: string[]): Promise<ProductCardData[]> {
  if (productIds.length === 0) return [];
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    include: { variants: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  return productIds
    .map((id) => byId.get(id))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .map(toProductCardData);
}

export async function searchProducts(query: ProductQuery) {
  const where: Record<string, unknown> = {};

  if (query.q) {
    const term = query.q.trim();
    if (term) {
      where.OR = [
        { title: { contains: term } },
        { description: { contains: term } },
        { brand: { contains: term } },
      ];
    }
  }

  if (query.categorySlug) {
    where.category = { slug: query.categorySlug };
  }

  const products = await db.product.findMany({
    where,
    include: { variants: true, category: true },
  });

  let cards: (ProductCardData & { categorySlug: string })[] = products.map((p) => ({
    ...toProductCardData(p),
    categorySlug: p.category.slug,
  }));

  if (typeof query.minPriceCents === "number") {
    cards = cards.filter((c) => c.priceCents >= query.minPriceCents!);
  }
  if (typeof query.maxPriceCents === "number") {
    cards = cards.filter((c) => c.priceCents <= query.maxPriceCents!);
  }

  switch (query.sort) {
    case "price-asc":
      cards.sort((a, b) => a.priceCents - b.priceCents);
      break;
    case "price-desc":
      cards.sort((a, b) => b.priceCents - a.priceCents);
      break;
    case "rating-desc":
      cards.sort((a, b) => b.rating - a.rating);
      break;
    default:
      break; // "relevance" — DB order
  }

  return cards;
}

export { effectivePrice };
