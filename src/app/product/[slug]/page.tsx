import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProductDetail } from "@/components/ProductDetail";
import { ReviewsSection } from "@/components/ReviewsSection";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await db.product.findUnique({
    where: { slug },
    include: {
      variants: true,
      reviews: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!product) notFound();

  const images: string[] = JSON.parse(product.images);

  return (
    <div>
      <ProductDetail
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
        rating={product.rating}
        reviews={product.reviews.map((r) => ({
          id: r.id,
          authorName: r.authorName,
          rating: r.rating,
          title: r.title,
          body: r.body,
          createdAt: r.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
