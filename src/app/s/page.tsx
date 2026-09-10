import { db } from "@/lib/db";
import { searchProducts, type SortOption } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { FilterSidebar, SortBar } from "@/components/ResultsToolbar";

export const dynamic = "force-dynamic";

type SearchParams = {
  k?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const categories = await db.category.findMany({ orderBy: { name: "asc" } });

  const results = await searchProducts({
    q: params.k,
    categorySlug: params.category,
    minPriceCents: params.minPrice ? Number(params.minPrice) : undefined,
    maxPriceCents: params.maxPrice ? Number(params.maxPrice) : undefined,
    sort: (params.sort as SortOption) ?? "relevance",
  });

  return (
    <div className="mx-auto max-w-7xl px-3 py-4">
      <p className="text-sm text-gray-600 mb-3">
        {params.k ? (
          <>
            Results for <span className="font-semibold text-gray-900">&quot;{params.k}&quot;</span>
          </>
        ) : (
          "All products"
        )}
      </p>
      <div className="flex flex-col sm:flex-row gap-6">
        <FilterSidebar
          currentParams={params}
          categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
          showCategoryFilter
        />
        <div className="flex-1 min-w-0">
          <SortBar currentParams={params} resultCount={results.length} />
          {results.length === 0 ? (
            <div className="rounded border border-gray-200 p-8 text-center text-gray-600">
              <p className="font-semibold mb-1">No results found</p>
              <p className="text-sm">Try a different search term or clear your filters.</p>
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
