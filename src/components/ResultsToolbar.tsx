import Link from "next/link";

const PRICE_RANGES: { label: string; min?: number; max?: number }[] = [
  { label: "Any Price" },
  { label: "Under $25", max: 2500 },
  { label: "$25 to $50", min: 2500, max: 5000 },
  { label: "$50 to $100", min: 5000, max: 10000 },
  { label: "$100 & Above", min: 10000 },
];

const SORTS: { label: string; value: string }[] = [
  { label: "Featured", value: "relevance" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Avg. Customer Review", value: "rating-desc" },
];

function buildHref(base: Record<string, string | undefined>, overrides: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  const merged = { ...base, ...overrides };
  for (const [key, value] of Object.entries(merged)) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function FilterSidebar({
  currentParams,
  categories,
  showCategoryFilter,
}: {
  currentParams: Record<string, string | undefined>;
  categories: { slug: string; name: string }[];
  showCategoryFilter: boolean;
}) {
  const activeMin = currentParams.minPrice;
  const activeMax = currentParams.maxPrice;

  return (
    <aside className="w-full sm:w-56 shrink-0 space-y-6 text-sm">
      {showCategoryFilter && categories.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-900 mb-2">Department</h3>
          <ul className="space-y-1">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/c/${c.slug}${buildHref(currentParams, {})}`}
                  className={`hover:underline hover:text-orange-600 ${
                    currentParams.category === c.slug ? "font-bold text-orange-600" : "text-gray-700"
                  }`}
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="font-bold text-gray-900 mb-2">Price</h3>
        <ul className="space-y-1">
          {PRICE_RANGES.map((range) => {
            const isActive =
              (range.min ? String(range.min) : undefined) === activeMin &&
              (range.max ? String(range.max) : undefined) === activeMax;
            return (
              <li key={range.label}>
                <Link
                  href={buildHref(currentParams, {
                    minPrice: range.min ? String(range.min) : undefined,
                    maxPrice: range.max ? String(range.max) : undefined,
                  })}
                  className={`hover:underline hover:text-orange-600 ${
                    isActive ? "font-bold text-orange-600" : "text-gray-700"
                  }`}
                >
                  {range.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}

export function SortBar({
  currentParams,
  resultCount,
}: {
  currentParams: Record<string, string | undefined>;
  resultCount: number;
}) {
  const activeSort = currentParams.sort ?? "relevance";
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-3 mb-4">
      <p className="text-sm text-gray-700">{resultCount} results</p>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-gray-600">Sort by:</span>
        {SORTS.map((s) => (
          <Link
            key={s.value}
            href={buildHref(currentParams, { sort: s.value === "relevance" ? undefined : s.value })}
            className={`hover:underline ${
              activeSort === s.value ? "font-bold text-orange-600" : "text-blue-700"
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
