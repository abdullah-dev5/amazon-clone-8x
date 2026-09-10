import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { WishlistList } from "@/components/WishlistList";

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/account/wishlist");

  const wishlist = await db.wishlist.findUnique({
    where: { userId: user.id },
    include: { items: { include: { variant: { include: { product: true } } } } },
  });

  const lines = (wishlist?.items ?? []).map((item) => ({
    variantId: item.variantId,
    productSlug: item.variant.product.slug,
    productTitle: item.variant.product.title,
    variantName: item.variant.name,
    imageUrl: item.variant.imageUrl,
    priceCents: item.variant.priceCents,
    inStock: item.variant.stock > 0,
  }));

  return (
    <div className="mx-auto max-w-5xl px-3 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Your Wishlist</h1>
      <WishlistList initialLines={lines} />
    </div>
  );
}
