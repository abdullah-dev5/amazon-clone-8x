import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { searchProducts, type SortOption } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { FilterSidebar, SortBar } from "@/components/ResultsToolbar";

export const dynamic = "force-dynamic";

type SearchParams = {
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
};

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { category: categorySlug } = await params;
  const sp = await searchParams;

  const category = await db.category.findUnique({ where: { slug: categorySlug } });
  if (!category) notFound();

  const results = await searchProducts({
    categorySlug,
    minPriceCents: sp.minPrice ? Number(sp.minPrice) : undefined,
    maxPriceCents: sp.maxPrice ? Number(sp.maxPrice) : undefined,
    sort: (sp.sort as SortOption) ?? "relevance",
  });

  return (
    <div className="mx-auto max-w-7xl px-3 py-4">
      <h1 className="text-xl font-bold text-gray-900 mb-3">{category.name}</h1>
      <div className="flex flex-col sm:flex-row gap-6">
        <FilterSidebar currentParams={sp} categories={[]} showCategoryFilter={false} />
        <div className="flex-1 min-w-0">
          <SortBar currentParams={sp} resultCount={results.length} />
          {results.length === 0 ? (
            <div className="rounded border border-gray-200 p-8 text-center text-gray-600">
              <p className="font-semibold mb-1">No products match these filters</p>
              <p className="text-sm">Try clearing the price filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {results.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
