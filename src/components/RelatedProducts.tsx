import { ProductCard, type ProductCardData } from "@/components/ProductCard";

export function RelatedProducts({ products }: { products: ProductCardData[] }) {
  if (products.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-3 py-8 border-t border-gray-200">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Related products</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8">
        {products.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </section>
  );
}
