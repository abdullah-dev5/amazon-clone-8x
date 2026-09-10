import Image from "next/image";
import Link from "next/link";
import { StarRating } from "@/components/StarRating";
import { PriceTag } from "@/components/PriceTag";

export type ProductCardData = {
  slug: string;
  title: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  priceCents: number;
  compareAtCents?: number | null;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col gap-2 rounded-lg border border-transparent p-3 hover:border-gray-200 hover:shadow-md transition"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-gray-100">
        <Image
          src={product.imageUrl}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
          className="object-cover group-hover:scale-105 transition-transform duration-200"
        />
      </div>
      <h3 className="text-sm text-gray-800 line-clamp-2 min-h-[2.5rem]">{product.title}</h3>
      <StarRating rating={product.rating} reviewCount={product.reviewCount} />
      <PriceTag priceCents={product.priceCents} compareAtCents={product.compareAtCents} size="sm" />
    </Link>
  );
}
