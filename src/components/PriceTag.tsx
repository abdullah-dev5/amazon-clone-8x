import { formatPrice } from "@/lib/format";

export function PriceTag({
  priceCents,
  compareAtCents,
  size = "md",
}: {
  priceCents: number;
  compareAtCents?: number | null;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = { sm: "text-lg", md: "text-2xl", lg: "text-3xl" }[size];
  const hasDiscount = !!compareAtCents && compareAtCents > priceCents;
  const percentOff = hasDiscount
    ? Math.round(((compareAtCents! - priceCents) / compareAtCents!) * 100)
    : 0;

  return (
    <div className="flex items-baseline gap-2 flex-wrap">
      {hasDiscount && (
        <span className="text-red-700 font-medium text-sm">-{percentOff}%</span>
      )}
      <span className={`${sizeClass} font-semibold text-gray-900`}>
        {formatPrice(priceCents)}
      </span>
      {hasDiscount && (
        <span className="text-sm text-gray-500 line-through">
          {formatPrice(compareAtCents!)}
        </span>
      )}
    </div>
  );
}
