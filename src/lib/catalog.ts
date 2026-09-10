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

  let cards: (ProductCardData & { categorySlug: string })[] = products.map((p) => {
    const defaultVariant = p.variants.find((v) => v.isDefault) ?? p.variants[0];
    const images: string[] = JSON.parse(p.images);
    return {
      slug: p.slug,
      title: p.title,
      rating: p.rating,
      reviewCount: p.reviewCount,
      imageUrl: defaultVariant?.imageUrl ?? images[0],
      priceCents: defaultVariant?.priceCents ?? 0,
      compareAtCents: defaultVariant?.compareAtCents ?? null,
      categorySlug: p.category.slug,
    };
  });

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
