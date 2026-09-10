"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { updateReviewSchema } from "@/lib/validation/review";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button";
import { StarRating } from "@/components/StarRating";

export type MyReview = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
};

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          onClick={() => onChange(n)}
          className="p-0.5"
        >
          <Star
            className={`h-6 w-6 ${n <= value ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}

export function ReviewForm({
  productId,
  productSlug,
  signedIn,
  initialReview,
}: {
  productId: string;
  productSlug: string;
  signedIn: boolean;
  initialReview: MyReview | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(!initialReview);
  const [rating, setRating] = useState(initialReview?.rating ?? 0);
  const [title, setTitle] = useState(initialReview?.title ?? "");
  const [body, setBody] = useState(initialReview?.body ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!signedIn) {
    return (
      <p className="text-sm text-gray-600">
        <Link href={`/signin?next=/product/${productSlug}`} className="text-blue-700 hover:underline">
          Sign in
        </Link>{" "}
        to write a review.
      </p>
    );
  }

  if (initialReview && !editing) {
    return (
      <div className="rounded-lg border border-gray-200 p-3 text-sm space-y-1">
        <p className="font-medium text-gray-900">Your review</p>
        <StarRating rating={initialReview.rating} />
        {initialReview.title && <p className="font-semibold text-gray-900">{initialReview.title}</p>}
        {initialReview.body && <p className="text-gray-700">{initialReview.body}</p>}
        <div className="flex gap-2 pt-1">
          <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
            Edit
          </Button>
          <DeleteReviewButton reviewId={initialReview.id} onDeleted={() => router.refresh()} />
        </div>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Only used for instant client-side feedback — the raw pre-transform
    // values (not this parsed/transformed result) are what's actually
    // sent, so the server does its own canonicalizing transform exactly
    // once. Sending the already-transformed output back as input would
    // fail re-validation: an empty title becomes `null` here, and `null`
    // is only ever this schema's *output* shape, never a valid *input*.
    const localCheck = updateReviewSchema.safeParse({ rating, title, body });
    if (!localCheck.success) {
      setError(localCheck.error.issues[0]?.message ?? "Check your review and try again.");
      return;
    }

    setSubmitting(true);
    const rawPayload = { rating, title, body };
    const res = await fetch(initialReview ? `/api/reviews/${initialReview.id}` : "/api/reviews", {
      method: initialReview ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(initialReview ? rawPayload : { ...rawPayload, productId }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error ?? "Something went wrong submitting your review.");
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    setEditing(false);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-gray-200 p-3 space-y-3 text-sm">
      <p className="font-medium text-gray-900">{initialReview ? "Edit your review" : "Write a review"}</p>
      <div>
        <Label className="mb-1 block">Rating</Label>
        <StarPicker value={rating} onChange={setRating} />
      </div>
      <div>
        <Label htmlFor="review-title" className="mb-1 block">
          Title (optional)
        </Label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          className="w-full rounded-lg border border-gray-400 bg-white px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        />
      </div>
      <div>
        <Label htmlFor="review-body" className="mb-1 block">
          Review (optional)
        </Label>
        <textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          rows={3}
          className="w-full rounded-lg border border-gray-400 bg-white px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        />
      </div>
      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={submitting || rating === 0}>
          {submitting ? "Saving…" : initialReview ? "Save changes" : "Submit review"}
        </Button>
        {initialReview && (
          <button
            type="button"
            className={buttonVariants({ variant: "outline", size: "sm" })}
            onClick={() => {
              setEditing(false);
              setRating(initialReview.rating);
              setTitle(initialReview.title ?? "");
              setBody(initialReview.body ?? "");
              setError(null);
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function DeleteReviewButton({ reviewId, onDeleted }: { reviewId: string; onDeleted: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/reviews/${reviewId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Couldn't delete your review.");
      setSubmitting(false);
      return;
    }
    onDeleted();
  }

  return (
    <span className="inline-flex items-center gap-2">
      <Button type="button" variant="destructive" size="sm" onClick={remove} disabled={submitting}>
        {submitting ? "Deleting…" : "Delete"}
      </Button>
      {error && <span className="text-red-600">{error}</span>}
    </span>
  );
}
