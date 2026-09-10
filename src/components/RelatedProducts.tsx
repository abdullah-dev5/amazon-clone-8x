import type { ProductCardData } from "@/components/ProductCard";
import { ProductCarousel } from "@/components/ProductCarousel";

export function RelatedProducts({ products }: { products: ProductCardData[] }) {
  if (products.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-3 py-8 border-t border-gray-200">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Related products</h2>
      <ProductCarousel products={products} />
    </section>
  );
}
