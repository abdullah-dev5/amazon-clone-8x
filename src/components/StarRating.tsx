function Star({ fill }: { fill: number }) {
  return (
    <span className="relative inline-block h-4 w-4 align-middle">
      <svg viewBox="0 0 20 20" className="h-4 w-4 text-gray-300" fill="currentColor">
        <path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6L10 1.5z" />
      </svg>
      <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
        <svg viewBox="0 0 20 20" className="h-4 w-4 text-amber-400" fill="currentColor">
          <path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6L10 1.5z" />
        </svg>
      </span>
    </span>
  );
}

/**
 * Single shared rating display — product cards, search results, PDP,
 * related products, and the reviews summary all use this instead of each
 * rendering their own stars, so the fill math (and its accessible text)
 * only exists in one place.
 */
export function StarRating({
  rating,
  reviewCount,
  size = "sm",
  showValue = false,
  linkToReviews = false,
}: {
  rating: number;
  reviewCount?: number;
  size?: "sm" | "md";
  /** Show the numeric average (e.g. "4.5") next to the stars. */
  showValue?: boolean;
  /** Render the review count as a jump link to the #reviews section on
   * this same page (PDP only) instead of plain text. */
  linkToReviews?: boolean;
}) {
  const stars = [0, 1, 2, 3, 4].map((i) => {
    const fill = Math.max(0, Math.min(1, rating - i));
    return <Star key={i} fill={fill} />;
  });
  const accessibleLabel = `${rating.toFixed(1)} out of 5 stars`;

  return (
    <div className={`flex items-center gap-1 ${size === "md" ? "text-base" : "text-sm"}`}>
      <div className="flex" role="img" aria-label={accessibleLabel}>
        {stars}
      </div>
      {showValue && <span className="text-gray-700">{rating.toFixed(1)}</span>}
      {typeof reviewCount === "number" &&
        (linkToReviews ? (
          <a href="#reviews" className="text-blue-700 hover:text-orange-600 hover:underline">
            {reviewCount.toLocaleString()}
          </a>
        ) : (
          <span className="text-gray-600">{reviewCount.toLocaleString()}</span>
        ))}
    </div>
  );
}
