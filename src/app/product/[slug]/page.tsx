import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getRelatedProducts } from "@/lib/catalog";
import { db } from "@/lib/db";
import { ProductDetail } from "@/components/ProductDetail";
import { RecordRecentlyViewed } from "@/components/RecordRecentlyViewed";
import { RelatedProducts } from "@/components/RelatedProducts";
import { ReviewsSection } from "@/components/ReviewsSection";
import { Breadcrumb } from "@/components/Breadcrumb";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [product, user] = await Promise.all([
    db.product.findUnique({
      where: { slug },
      include: {
        variants: true,
        reviews: { orderBy: { createdAt: "desc" } },
        category: true,
      },
    }),
    getCurrentUser(),
  ]);

  if (!product) notFound();

  const relatedProducts = await getRelatedProducts(product);

  const images: string[] = JSON.parse(product.images);

  let wishlistedVariantIds: string[] = [];
  let myReview: { id: string; rating: number; title: string | null; body: string | null } | null = null;
  if (user) {
    const [wishlist, existingReview] = await Promise.all([
      db.wishlist.findUnique({ where: { userId: user.id }, include: { items: true } }),
      db.review.findUnique({ where: { productId_userId: { productId: product.id, userId: user.id } } }),
    ]);
    const variantIds = new Set(product.variants.map((v) => v.id));
    wishlistedVariantIds = (wishlist?.items ?? [])
      .filter((i) => variantIds.has(i.variantId))
      .map((i) => i.variantId);
    myReview = existingReview
      ? { id: existingReview.id, rating: existingReview.rating, title: existingReview.title, body: existingReview.body }
      : null;
  }

  return (
    <div>
      <RecordRecentlyViewed productId={product.id} />
      <div className="mx-auto max-w-7xl px-3 pt-4">
        <Breadcrumb
          items={[
            { label: product.category.name, href: `/c/${product.category.slug}` },
            { label: product.title },
          ]}
        />
      </div>
      <ProductDetail
        signedIn={!!user}
        initialWishlistedVariantIds={wishlistedVariantIds}
        product={{
          slug: product.slug,
          title: product.title,
          brand: product.brand,
          description: product.description,
          images,
          rating: product.rating,
          reviewCount: product.reviewCount,
          variants: product.variants.map((v) => ({
            id: v.id,
            name: v.name,
            priceCents: v.priceCents,
            compareAtCents: v.compareAtCents,
            stock: v.stock,
            imageUrl: v.imageUrl,
            isDefault: v.isDefault,
          })),
        }}
      />
      <ReviewsSection
        productId={product.id}
        productSlug={product.slug}
        rating={product.rating}
        signedIn={!!user}
        myReview={myReview}
        reviews={product.reviews.map((r) => ({
          id: r.id,
          authorName: r.authorName,
          rating: r.rating,
          title: r.title,
          body: r.body,
          createdAt: r.createdAt.toISOString(),
        }))}
      />
      <RelatedProducts products={relatedProducts} />
    </div>
  );
}
