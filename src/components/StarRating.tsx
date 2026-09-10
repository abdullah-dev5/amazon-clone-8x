function Star({ fill }: { fill: number }) {
  const clipId = `star-clip-${Math.round(fill * 100)}`;
  return (
    <span className="relative inline-block h-4 w-4 align-middle">
      <svg viewBox="0 0 20 20" className="h-4 w-4 text-gray-300" fill="currentColor">
        <path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6L10 1.5z" />
      </svg>
      <span
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${fill * 100}%` }}
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4 text-amber-400" fill="currentColor">
          <path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6L10 1.5z" />
        </svg>
      </span>
    </span>
  );
}

export function StarRating({
  rating,
  reviewCount,
  size = "sm",
}: {
  rating: number;
  reviewCount?: number;
  size?: "sm" | "md";
}) {
  const stars = [0, 1, 2, 3, 4].map((i) => {
    const fill = Math.max(0, Math.min(1, rating - i));
    return <Star key={i} fill={fill} />;
  });

  return (
    <div className={`flex items-center gap-1 ${size === "md" ? "text-base" : "text-sm"}`}>
      <div className="flex">{stars}</div>
      {typeof reviewCount === "number" && (
        <span className="text-blue-700 hover:text-orange-600 hover:underline cursor-pointer">
          {reviewCount.toLocaleString()}
        </span>
      )}
    </div>
  );
}
