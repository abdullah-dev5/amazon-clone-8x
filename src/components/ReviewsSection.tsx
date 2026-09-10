import { StarRating } from "@/components/StarRating";
import { ReviewForm, type MyReview } from "@/components/ReviewForm";

export type ReviewData = {
  id: string;
  authorName: string;
  rating: number;
  title: string | null;
  body: string | null;
  createdAt: string;
};

export function ReviewsSection({
  productId,
  productSlug,
  rating,
  reviews,
  signedIn,
  myReview,
}: {
  productId: string;
  productSlug: string;
  rating: number;
  reviews: ReviewData[];
  signedIn: boolean;
  myReview: MyReview | null;
}) {
  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
    return { star, count, pct };
  });

  return (
    <section className="mx-auto max-w-7xl px-3 py-8 border-t border-gray-200 grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Customer reviews</h2>
        <div className="flex items-center gap-2 mb-4">
          <StarRating rating={rating} size="md" />
          <span className="text-sm text-gray-600">{reviews.length} global ratings</span>
        </div>
        <div className="space-y-1">
          {distribution.map((d) => (
            <div key={d.star} className="flex items-center gap-2 text-sm">
              <span className="w-16 text-blue-700">{d.star} star</span>
              <div className="flex-1 h-3 rounded bg-gray-200 overflow-hidden">
                <div className="h-full bg-amber-400" style={{ width: `${d.pct}%` }} />
              </div>
              <span className="w-10 text-right text-gray-600">{d.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <ReviewForm
          productId={productId}
          productSlug={productSlug}
          signedIn={signedIn}
          initialReview={myReview}
        />
        {reviews.length === 0 && (
          <p className="text-sm text-gray-600">No reviews yet for this product.</p>
        )}
        {reviews.map((r) => (
          <div key={r.id} className="border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-7 w-7 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold text-gray-700">
                {r.authorName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-800">{r.authorName}</span>
            </div>
            <StarRating rating={r.rating} />
            {r.title && <p className="mt-1 font-semibold text-sm text-gray-900">{r.title}</p>}
            {r.body && <p className="mt-1 text-sm text-gray-700">{r.body}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
